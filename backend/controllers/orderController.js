const orderService = require('../services/orderService');
const restaurantService = require('../services/restaurantService');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const Razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? require('razorpay') : null;
const razorpayInstance = Razorpay ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;
const crypto = require('crypto');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const authService = require('../services/authService');
const _ = require('lodash');

function parseUserId(req) {
  const userId = req.headers['x-user-id'];
  return userId && userId !== 'Anonymous' ? parseInt(userId) : null;
}

async function createOrder(req, res) {
  try {
    const { items, total_price, address, latitude, longitude, payment_method, payment_status, customer_name, customer_phone, restaurant_id } = req.body;
    const userId = parseUserId(req);
    
    let finalResId = restaurant_id;
    if (!finalResId && items && items.length > 0) {
      finalResId = items[0].restaurant_id;
    }

    const order = await orderService.insertOrder({
      items,
      totalPrice: total_price,
      address,
      latitude,
      longitude,
      paymentMethod: payment_method,
      paymentStatus: payment_status,
      customerName: customer_name,
      customerPhone: customer_phone,
      userId,
      restaurantId: finalResId
    });
    
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOrders(req, res) {
  try {
    const userId = parseUserId(req);
    let filter = {};
    
    if (userId) {
      const user = await authService.getUserById(userId);
      if (user) {
        if (user.role === 'restaurant') {
          filter = { restaurantId: user.restaurant_id };
        } else if (user.role === 'user') {
          filter = { userId: user.id };
        }
      }
    }
    
    const orders = await orderService.getOrdersList(filter);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function trackOrder(req, res) {
  try {
    const orderId = req.params.id;
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).end();
    }
    
    const userLat = parseFloat(order.latitude) || 28.6139;
    const userLng = parseFloat(order.longitude) || 77.2090;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    let startLat = 28.6100;
    let startLng = 77.2000;
    if (order.restaurant_id) {
      const restaurant = await restaurantService.getRestaurantById(order.restaurant_id);
      if (restaurant) {
        startLat = parseFloat(restaurant.latitude) || startLat;
        startLng = parseFloat(restaurant.longitude) || startLng;
      }
    }

    let step = 0;
    const totalSteps = 10;
    
    const sendUpdate = (status, lat, lng) => {
      res.write('data: ' + JSON.stringify({ 
        status, 
        lat, 
        lng,
        delivery_boy: {
          name: order.delivery_boy_name || 'Ramesh Kumar',
          phone: order.delivery_boy_phone || '+91 9898989898',
          vehicle: order.delivery_boy_vehicle || 'Splendor Plus (KA-03-HJ-4567)'
        },
        restaurant: {
          id: order.restaurant_id,
          lat: startLat,
          lng: startLng
        },
        customer: {
          lat: userLat,
          lng: userLng
        }
      }) + '\n\n');
    };

    sendUpdate('Placed', startLat, startLng);

    const interval = setInterval(async () => {
      step++;
      if (step <= 2) {
        sendUpdate('Preparing Food', startLat, startLng);
      } else if (step < totalSteps) {
        const ratio = (step - 2) / (totalSteps - 2);
        const currentLat = startLat + (userLat - startLat) * ratio;
        const currentLng = startLng + (userLng - startLng) * ratio;
        
        sendUpdate('Out for Delivery', currentLat, currentLng);
        await orderService.updateDeliveryBoyLocation(orderId, currentLat, currentLng);
      } else {
        sendUpdate('Delivered', userLat, userLng);
        await orderService.updateOrderStatus(orderId, 'Delivered');
        await orderService.updateDeliveryBoyLocation(orderId, userLat, userLng);
        
        clearInterval(interval);
        res.end();
      }
    }, 2000);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (err) {
    res.status(500).end();
  }
}

async function createCheckoutSession(req, res) {
  try {
    const { items, total_price, address, latitude, longitude, customer_name, customer_phone, restaurant_id } = req.body;
    const userId = parseUserId(req);

    const paymentOtp = Math.floor(100000 + Math.random() * 900000).toString();

    let finalResId = restaurant_id;
    if (!finalResId && items && items.length > 0) {
      finalResId = items[0].restaurant_id;
    }

    const order = await orderService.insertOrder({
      items,
      totalPrice: total_price,
      address,
      latitude,
      longitude,
      paymentMethod: 'Card (Stripe)',
      paymentStatus: 'Pending',
      customerName: customer_name,
      customerPhone: customer_phone,
      paymentOtp: paymentOtp,
      userId,
      restaurantId: finalResId
    });

    if (!stripe) {
      console.log('Stripe not configured on backend. Simulating success redirect.');
      await smsService.sendSMSOTP(customer_phone, paymentOtp);
      
      if (userId) {
        const user = await authService.getUserById(userId);
        if (user && user.email) {
          await emailService.sendPaymentOTPEmail(user.email, paymentOtp, total_price);
        }
      }

      return res.json({ mockRedirect: true, orderId: order.id });
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'inr',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));

    lineItems.push({
      price_data: {
        currency: 'inr',
        product_data: { name: 'Delivery Fee' },
        unit_amount: 4000,
      },
      quantity: 1,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${frontendUrl}/checkout?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${frontendUrl}/checkout`,
      metadata: { orderId: order.id.toString() }
    });

    res.json({ url: session.url, orderId: order.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function confirmPayment(req, res) {
  try {
    const { sessionId, orderId, otp } = req.body;

    if (!stripe || sessionId === 'mock') {
      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      if (order.payment_otp && order.payment_otp.trim() !== (otp || '').trim()) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      await orderService.updatePaymentStatus(orderId, 'Paid');
      return res.json({ success: true, message: 'Mock payment confirmed successfully.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      await orderService.updatePaymentStatus(orderId, 'Paid');
      res.json({ success: true, message: 'Stripe payment confirmed successfully.' });
    } else {
      res.status(400).json({ error: 'Stripe payment was not completed.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createRazorpayOrder(req, res) {
  try {
    const { items, total_price, address, latitude, longitude, customer_name, customer_phone, restaurant_id } = req.body;
    const userId = parseUserId(req);

    let finalResId = restaurant_id;
    if (!finalResId && items && items.length > 0) {
      finalResId = items[0].restaurant_id;
    }

    const order = await orderService.insertOrder({
      items,
      totalPrice: total_price,
      address,
      latitude,
      longitude,
      paymentMethod: 'UPI / Card (Razorpay)',
      paymentStatus: 'Pending',
      customerName: customer_name,
      customerPhone: customer_phone,
      userId,
      restaurantId: finalResId
    });

    if (!razorpayInstance) {
      console.log('Razorpay not configured on backend. Simulating mock checkout.');
      return res.json({ mockRedirect: true, orderId: order.id });
    }

    const options = {
      amount: Math.round(total_price * 100),
      currency: 'INR',
      receipt: `receipt_order_${order.id}`,
      notes: { orderId: order.id.toString() }
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      orderId: order.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function verifyRazorpayPayment(req, res) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!razorpayInstance || razorpayOrderId === 'mock') {
      await orderService.updatePaymentStatus(orderId, 'Paid');
      return res.json({ success: true, message: 'Mock payment verified successfully.' });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === razorpaySignature) {
      await orderService.updatePaymentStatus(orderId, 'Paid');
      res.json({ success: true, message: 'Razorpay payment verified successfully.' });
    } else {
      res.status(400).json({ error: 'Signature verification failed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getRestaurantDashboardStats(req, res) {
  try {
    const userId = parseUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await authService.getUserById(userId);
    if (!user || user.role !== 'restaurant') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!user.restaurant_id) {
      return res.status(400).json({ error: 'No restaurant associated with this owner.' });
    }

    const stats = await orderService.getRestaurantStats(user.restaurant_id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function withdrawEarnings(req, res) {
  try {
    const userId = parseUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await authService.getUserById(userId);
    if (!user || user.role !== 'restaurant') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { amount, paymentMethod, details } = req.body;
    const stats = await orderService.getRestaurantStats(user.restaurant_id);
    
    if (parseFloat(amount) > stats.remainingBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const withdrawal = await orderService.createWithdrawal(user.restaurant_id, amount, paymentMethod, details);
    res.status(201).json(withdrawal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAdminDashboardStats(req, res) {
  try {
    const userId = parseUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getUserById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await orderService.getAdminStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  getOrders,
  trackOrder,
  createCheckoutSession,
  confirmPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRestaurantDashboardStats,
  withdrawEarnings,
  getAdminDashboardStats
};
