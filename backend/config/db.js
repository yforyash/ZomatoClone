const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('supabase.co') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'zomato_clone',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    });

pool.on('error', (err) => console.error('Unexpected Postgres pool error:', err));
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
