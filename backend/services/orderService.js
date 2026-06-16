const { query } = require('../config/db');
const _ = require('lodash');

const deliveryBoys = [
  { name: 'Rajesh Sharma', phone: '+91 9898989898', vehicle: 'Splendor Plus (KA-03-HJ-4567)' },
  { name: 'Manish Patel', phone: '+91 9797979797', vehicle: 'Pulsar 150 (KA-01-EE-7890)' },
  { name: 'Arjun Singh', phone: '+91 9696969696', vehicle: 'Activa 125 (KA-05-MK-1234)' },
  { name: 'Karan Verma', phone: '+91 9595959595', vehicle: 'TVS Apache (KA-04-TR-9012)' }
];

async function insertOrder(orderData) {
  const items = _.get(orderData, 'items', []);
  const totalPrice = _.get(orderData, 'totalPrice', 0);
  const address = _.get(orderData, 'address', '');
  const latitude = _.get(orderData, 'latitude', null);
  const longitude = _.get(orderData, 'longitude', null);
  const paymentMethod = _.get(orderData, 'paymentMethod', 'COD');
  const paymentStatus = _.get(orderData, 'paymentStatus', 'Pending');
  const customerName = _.get(orderData, 'customerName', 'Anonymous');
  const customerPhone = _.get(orderData, 'customerPhone', '');
  const paymentOtp = _.get(orderData, 'paymentOtp', null);
  const userId = _.get(orderData, 'userId', null);
  const restaurantId = _.get(orderData, 'restaurantId', null);

  const dboy = _.sample(deliveryBoys);

  const result = await query(
    `INSERT INTO orders (items, total_price, address, latitude, longitude, payment_method, payment_status, customer_name, customer_phone, payment_otp, user_id, restaurant_id, delivery_boy_name, delivery_boy_phone, delivery_boy_vehicle, delivery_boy_latitude, delivery_boy_longitude) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
    [
      JSON.stringify(items), 
      totalPrice, 
      address, 
      latitude, 
      longitude, 
      paymentMethod, 
      paymentStatus, 
      customerName, 
      customerPhone,
      paymentOtp,
      userId,
      restaurantId,
      dboy.name,
      dboy.phone,
      dboy.vehicle,
      latitude ? parseFloat(latitude) - 0.005 : null,
      longitude ? parseFloat(longitude) - 0.005 : null
    ]
  );
  
  return result.rows[0];
}

async function getOrdersList(filter = {}) {
  let queryText = 'SELECT * FROM orders';
  const queryParams = [];
  
  if (_.has(filter, 'userId') && filter.userId !== null) {
    queryParams.push(filter.userId);
    queryText += ` WHERE user_id = $${queryParams.length}`;
  } else if (_.has(filter, 'restaurantId') && filter.restaurantId !== null) {
    queryParams.push(filter.restaurantId);
    queryText += ` WHERE restaurant_id = $${queryParams.length}`;
  }
  
  queryText += ' ORDER BY created_at DESC';
  
  const result = await query(queryText, queryParams);
  
  return result.rows.map(r => {
    const cloned = _.cloneDeep(r);
    cloned.items = typeof cloned.items === 'string' ? JSON.parse(cloned.items) : cloned.items;
    return cloned;
  });
}

async function getOrderById(id) {
  const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateOrderStatus(id, status) {
  await query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
}

async function updatePaymentStatus(id, status) {
  await query("UPDATE orders SET payment_status = $1 WHERE id = $2", [status, id]);
}

async function updateDeliveryBoyLocation(id, lat, lng) {
  await query("UPDATE orders SET delivery_boy_latitude = $1, delivery_boy_longitude = $2 WHERE id = $3", [lat, lng, id]);
}

async function getRestaurantStats(restaurantId) {
  const salesRes = await query(
    `SELECT COUNT(*), SUM(total_price) FROM orders 
     WHERE restaurant_id = $1 AND payment_status = 'Paid'`,
    [restaurantId]
  );
  
  const totalSales = parseFloat(_.get(salesRes, 'rows[0].sum', 0)) || 0;
  const orderCount = parseInt(_.get(salesRes, 'rows[0].count', 0)) || 0;
  
  const commissionRate = 0.10;
  const commission = parseFloat((totalSales * commissionRate).toFixed(2));
  const netEarnings = parseFloat((totalSales * (1 - commissionRate)).toFixed(2));

  const withdrawalsRes = await query(
    `SELECT * FROM withdrawals WHERE restaurant_id = $1 ORDER BY created_at DESC`,
    [restaurantId]
  );

  const totalWithdrawnRes = await query(
    `SELECT SUM(amount) FROM withdrawals WHERE restaurant_id = $1 AND status = 'Approved'`,
    [restaurantId]
  );
  const totalWithdrawn = parseFloat(_.get(totalWithdrawnRes, 'rows[0].sum', 0)) || 0;
  const remainingBalance = parseFloat((netEarnings - totalWithdrawn).toFixed(2));

  return {
    orderCount,
    totalSales,
    commission,
    netEarnings,
    remainingBalance,
    totalWithdrawn,
    withdrawals: withdrawalsRes.rows
  };
}

async function createWithdrawal(restaurantId, amount, paymentMethod, details) {
  const result = await query(
    `INSERT INTO withdrawals (restaurant_id, amount, payment_method, details, status) 
     VALUES ($1, $2, $3, $4, 'Approved') RETURNING *`,
    [restaurantId, amount, paymentMethod, details]
  );
  return result.rows[0];
}

async function getAdminStats() {
  const salesRes = await query(`SELECT COUNT(*), SUM(total_price) FROM orders WHERE payment_status = 'Paid'`);
  const totalSales = parseFloat(_.get(salesRes, 'rows[0].sum', 0)) || 0;
  const orderCount = parseInt(_.get(salesRes, 'rows[0].count', 0)) || 0;
  
  const commission = parseFloat((totalSales * 0.10).toFixed(2));
  
  const usersCountRes = await query(`SELECT COUNT(*) FROM users WHERE role = 'user'`);
  const restaurantsCountRes = await query(`SELECT COUNT(*) FROM restaurants`);
  
  const usersCount = parseInt(_.get(usersCountRes, 'rows[0].count', 0));
  const restaurantsCount = parseInt(_.get(restaurantsCountRes, 'rows[0].count', 0));

  const usersRes = await query(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`);
  const restaurantsRes = await query(`SELECT id, name, cuisine, rating, address FROM restaurants ORDER BY id ASC`);

  return {
    orderCount,
    totalSales,
    commission,
    usersCount,
    restaurantsCount,
    users: usersRes.rows,
    restaurants: restaurantsRes.rows
  };
}

module.exports = {
  insertOrder,
  getOrdersList,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateDeliveryBoyLocation,
  getRestaurantStats,
  createWithdrawal,
  getAdminStats
};
