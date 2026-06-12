const { query } = require('../config/db');

async function insertOrder(orderData) {
  const { items, totalPrice, address, latitude, longitude, paymentMethod, paymentStatus, customerName, customerPhone } = orderData;
  
  const result = await query(
    `INSERT INTO orders (items, total_price, address, latitude, longitude, payment_method, payment_status, customer_name, customer_phone) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      JSON.stringify(items), 
      totalPrice, 
      address, 
      latitude, 
      longitude, 
      paymentMethod || 'COD', 
      paymentStatus || 'Paid', 
      customerName || 'Anonymous', 
      customerPhone || ''
    ]
  );
  
  return result.rows[0];
}

async function getOrdersList() {
  const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
  
  return result.rows.map(r => ({
    ...r,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
  }));
}

async function getOrderById(id) {
  const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateOrderStatus(id, status) {
  await query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
}

module.exports = {
  insertOrder,
  getOrdersList,
  getOrderById,
  updateOrderStatus
};
