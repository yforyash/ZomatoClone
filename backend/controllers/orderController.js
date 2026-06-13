const orderService = require('../services/orderService');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

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

    const order = await orderService.insertOrder({
      items,
      totalPrice: total_price,
      address,
      latitude,
      longitude,
      paymentMethod: 'Card (Stripe)',
      paymentStatus: 'Pending',
      customerName: customer_name,
      customerPhone: customer_phone
    });

    if (!stripe) {
      console.log('Stripe not configured on backend. Simulating success redirect.');
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
    const { sessionId, orderId } = req.body;

    if (!stripe || sessionId === 'mock') {
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

module.exports = {
  createOrder,
  getOrders,
  trackOrder,
  createCheckoutSession,
  confirmPayment
};
