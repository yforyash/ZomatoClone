const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'Zomato-clone',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function reset() {
  await client.connect();
  console.log('Dropping tables to trigger fresh re-seed...');
  try {
    await client.query('DROP TABLE IF EXISTS orders, reviews, menu_items, restaurants, password_resets, users CASCADE;');
    console.log('Tables dropped successfully.');
  } catch (err) {
    console.error('Error resetting:', err);
  } finally {
    await client.end();
  }
}
reset();
