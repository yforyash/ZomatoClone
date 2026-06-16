const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { query } = require('./config/db');
const { seedRestaurants } = require('./config/seed');
const requestLogger = require('./middlewares/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

async function initDatabase() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        token VARCHAR(100) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        cuisine VARCHAR(100) NOT NULL,
        rating NUMERIC(2, 1) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        cost_for_two INTEGER DEFAULT 0,
        delivery_time INTEGER DEFAULT 30,
        image_url TEXT,
        is_pure_veg BOOLEAN DEFAULT FALSE,
        latitude NUMERIC(9, 6),
        longitude NUMERIC(9, 6),
        address VARCHAR(255),
        phone VARCHAR(20)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        is_veg BOOLEAN DEFAULT TRUE,
        is_bestseller BOOLEAN DEFAULT FALSE,
        image_url TEXT,
        description TEXT
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        reviewer_name VARCHAR(100) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        tags VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        items JSONB NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Placed',
        address VARCHAR(255),
        latitude NUMERIC(9, 6),
        longitude NUMERIC(9, 6),
        payment_method VARCHAR(50) DEFAULT 'COD',
        payment_status VARCHAR(50) DEFAULT 'Pending',
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        payment_otp VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Schema alterations
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL;`);
    
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL;`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_otp VARCHAR(10);`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_boy_name VARCHAR(100);`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_boy_phone VARCHAR(20);`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_boy_vehicle VARCHAR(50);`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_boy_latitude NUMERIC(9, 6);`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_boy_longitude NUMERIC(9, 6);`);

    // User Addresses Table
    await query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        address_line VARCHAR(255) NOT NULL,
        latitude NUMERIC(9, 6),
        longitude NUMERIC(9, 6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Favorites Table
    await query(`
      CREATE TABLE IF NOT EXISTS favorite_restaurants (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, restaurant_id)
      );
    `);

    // Withdrawals Table
    await query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Approved',
        payment_method VARCHAR(50) NOT NULL,
        details VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const resCheck = await query('SELECT COUNT(*) FROM restaurants');
    if (resCheck.rows.length === 0 || parseInt(resCheck.rows[0].count) === 0) {
      await seedRestaurants();
    }

    // Seed test accounts
    const firstRes = await query('SELECT id FROM restaurants ORDER BY id ASC LIMIT 1');
    const firstResId = firstRes.rows.length > 0 ? firstRes.rows[0].id : null;

    await query(`
      INSERT INTO users (name, email, password_hash, role, restaurant_id)
      VALUES 
        ('Zomato Admin', 'admin@zomato.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', NULL),
        ('Bistro Owner', 'owner@zomato.com', '43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9', 'restaurant', $1),
        ('John Customer', 'customer@zomato.com', 'b041c0aeb35bb0fa4aa668ca5a920b590196fdaf9a00eb852c9b7f4d123cc6d6', 'user', NULL)
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name, 
        password_hash = EXCLUDED.password_hash, 
        role = EXCLUDED.role, 
        restaurant_id = COALESCE(users.restaurant_id, EXCLUDED.restaurant_id);
    `, [firstResId]);
    console.log('[DB] Seeding of test accounts completed.');

  } catch (error) {
    console.error('Error during database initialization:', error.message);
  }
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/user', require('./routes/user'));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zomato Clone API Documentation',
      version: '1.0.0',
      description: 'Interactive API sandbox for Zomato Clone endpoints.'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`
      }
    ]
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

swaggerSpec.paths = {
  '/api/restaurants': {
    'get': {
      'summary': 'Retrieve all restaurants',
      'parameters': [
        { 'name': 'search', 'in': 'query', 'schema': { 'type': 'string' } },
        { 'name': 'veg', 'in': 'query', 'schema': { 'type': 'string', 'enum': ['true', 'false'] } }
      ],
      'responses': {
        '200': { 'description': 'List of restaurants' }
      }
    }
  },
  '/api/restaurants/import-external': {
    'post': {
      'summary': 'Import restaurants from external Zomato API',
      'responses': {
        '201': { 'description': 'List of imported restaurants' }
      }
    }
  },
  '/api/restaurants/{id}': {
    'get': {
      'summary': 'Retrieve restaurant details by ID',
      'parameters': [
        { 'name': 'id', 'in': 'path', 'required': true, 'schema': { 'type': 'integer' } }
      ],
      'responses': {
        '200': { 'description': 'Restaurant details object' }
      }
    }
  },
  '/api/orders/create-checkout-session': {
    'post': {
      'summary': 'Initialize checkout session and send OTP',
      'requestBody': {
        'required': true,
        'content': {
          'application/json': {
            'schema': {
              'type': 'object',
              'properties': {
                'items': { 'type': 'array', 'items': { 'type': 'object' } },
                'total_price': { 'type': 'number' },
                'address': { 'type': 'string' },
                'customer_phone': { 'type': 'string' }
              }
            }
          }
        }
      },
      'responses': {
        '200': { 'description': 'Checkout session summary' }
      }
    }
  },
  '/api/orders/confirm-payment': {
    'post': {
      'summary': 'Verify OTP and confirm order payment',
      'requestBody': {
        'required': true,
        'content': {
          'application/json': {
            'schema': {
              'type': 'object',
              'properties': {
                'sessionId': { 'type': 'string' },
                'orderId': { 'type': 'integer' },
                'otp': { 'type': 'string' }
              }
            }
          }
        }
      },
      'responses': {
        '200': { 'description': 'Confirmation success state' }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 ZOMATO CLONE BACKEND RUNNING ON PORT ${PORT}`);
  });
}
startServer();

module.exports = app;
