const orderService = require('../services/orderService');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const Razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? require('razorpay') : null;
const razorpayInstance = Razorpay ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;
const crypto = require('crypto');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const authService = require('../services/authService');

async function createOrder(req, res) {
  try {
    const { items, total_price, address, latitude, longitude, payment_method, payment_status, customer_name, customer_phone } = req.body;
    
    const order = await orderService.insertOrder({
      items,
      totalPrice: total_price,
      address,
      latitude,
      longitude,
      paymentMethod: payment_method,
      paymentStatus: payment_status,
      customerName: customer_name,
      customerPhone: customer_phone
    });
    
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOrders(req, res) {
  try {
    const orders = await orderService.getOrdersList();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function trackOrder(req, res) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).end();
    }
    
    const userLat = parseFloat(order.latitude);
    const userLng = parseFloat(order.longitude);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const startLat = 28.6139;
    const startLng = 77.2090;

    let step = 0;
    const totalSteps = 10;
    
    res.write('data: ' + JSON.stringify({ status: 'Preparing Food', lat: startLat, lng: startLng }) + '\n\n');

    const interval = setInterval(async () => {
      step++;
      if (step <= 2) {
        res.write('data: ' + JSON.stringify({ status: 'Preparing Food', lat: startLat, lng: startLng }) + '\n\n');
      } else if (step < totalSteps) {
        const ratio = (step - 2) / (totalSteps - 2);
        const currentLat = startLat + (userLat - startLat) * ratio;
        const currentLng = startLng + (userLng - startLng) * ratio;
        res.write('data: ' + JSON.stringify({ status: 'Out for Delivery', lat: currentLat, lng: currentLng }) + '\n\n');
      } else {
        res.write('data: ' + JSON.stringify({ status: 'Delivered', lat: userLat, lng: userLng }) + '\n\n');
        
        await orderService.updateOrderStatus(req.params.id, 'Delivered');
        
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
    const { items, total_price, address, latitude, longitude, customer_name, customer_phone } = req.body;

    const paymentOtp = Math.floor(100000 + Math.random() * 900000).toString();

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
      paymentOtp: paymentOtp
    });

    if (!stripe) {
      console.log('Stripe not configured on backend. Simulating success redirect.');
      
      // Send SMS OTP
      await smsService.sendSMSOTP(customer_phone, paymentOtp);
      
      // Send Email OTP as backup if user is logged in
      const userId = req.headers['x-user-id'];
      if (userId && userId !== 'Anonymous') {
        const user = await authService.getUserById(parseInt(userId));
        if (user && user.email) {
          await emailService.sendPaymentOTPEmail(user.email, paymentOtp, total_price);
        }
      }

      return res.json({ mockRedirect: true, orderId: order.id });
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // in paise (cents)
      },
      quantity: item.qty,
    }));

    // Add delivery fee
    lineItems.push({
      price_data: {
        currency: 'inr',
        product_data: {
          name: 'Delivery Fee',
        },
        unit_amount: 4000, // Rs. 40 in paise
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
      metadata: {
        orderId: order.id.toString(),
      }
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
    const { items, total_price, address, latitude, longitude, customer_name, customer_phone } = req.body;

    const order = await orderService.insertOrder({
      items,
      totalPrice: total_price,
      address,
      latitude,
      longitude,
      paymentMethod: 'UPI / Card (Razorpay)',
      paymentStatus: 'Pending',
      customerName: customer_name,
      customerPhone: customer_phone
    });

    if (!razorpayInstance) {
      console.log('Razorpay not configured on backend. Simulating mock checkout.');
      return res.json({ mockRedirect: true, orderId: order.id });
    }

    const options = {
      amount: Math.round(total_price * 100), // in paise
      currency: 'INR',
      receipt: `receipt_order_${order.id}`,
      notes: {
        orderId: order.id.toString(),
      }
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

module.exports = {
  createOrder,
  getOrders,
  trackOrder,
  createCheckoutSession,
  confirmPayment,
  createRazorpayOrder,
  verifyRazorpayPayment
};
