const orderService = require('../services/orderService');

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

module.exports = {
  createOrder,
  getOrders,
  trackOrder
};
