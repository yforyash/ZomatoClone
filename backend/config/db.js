const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: !process.env.DATABASE_URL ? (process.env.DB_USER || 'postgres') : undefined,
  host: !process.env.DATABASE_URL ? (process.env.DB_HOST || 'localhost') : undefined,
  database: !process.env.DATABASE_URL ? (process.env.DB_DATABASE || 'zomato_clone') : undefined,
  password: !process.env.DATABASE_URL ? (process.env.DB_PASSWORD || 'postgres') : undefined,
  port: !process.env.DATABASE_URL ? parseInt(process.env.DB_PORT || '5432') : undefined,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('Unexpected Postgres pool error:', err));
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
