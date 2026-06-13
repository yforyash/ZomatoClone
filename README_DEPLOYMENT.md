# Zomato Clone Deployment Guide

This guide outlines how to deploy the Zomato Clone application (Backend and Frontend) to production environments and configure all the production features (Stripe payments, Managed DB, SMTP mail, and Maps).

---

## 1. Environment Variables Configuration

Create a `.env` file on your hosting providers with the following variables:

### Backend Environment Variables (`.env`)

```ini
# Server Port & Mode
PORT=5001
NODE_ENV=production

# Database Connection (Supported out-of-the-box with SSL)
# Use a cloud PostgreSQL provider like Supabase, Neon, or Render pg
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Frontend Redirect URLs (for Stripe callbacks)
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Real Stripe Checkout Payment Gateway (Optional - falls back to mock flow if omitted)
STRIPE_SECRET_KEY=sk_test_...

# Real SMTP Email Configuration for Forgot/Reset Passwords (Optional - falls back to mock logger)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_smtp_password_key
SMTP_FROM="Zomato Clone" <no-reply@yourdomain.com>
```

### Frontend Environment Variables (`.env.production` or Hosting UI Config)

```ini
# Production API endpoint URL
VITE_API_URL=https://your-backend-api.onrender.com
```

---

## 2. Deploying the Backend (Node.js/Express)

You can deploy the backend to **Render**, **Railway**, or **Heroku**.

### Steps for Render Deployment:
1. Create a new **Web Service** on Render.
2. Link it to your GitHub Repository.
3. Configure the following settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Go to **Environment** in the sidebar and enter the **Backend Environment Variables** listed above.
5. Copy the generated Web Service URL (e.g. `https://zomato-clone-api.onrender.com`).

---

## 3. Deploying the Frontend (React + Vite)

You can deploy the frontend to **Vercel** or **Netlify**.

### Steps for Vercel Deployment:
1. Create a new project in Vercel and import your repository.
2. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Expand **Environment Variables** and add:
   - `VITE_API_URL` = (Your backend Web Service URL, e.g. `https://zomato-clone-api.onrender.com` - *do not include a trailing slash*).
4. Click **Deploy**.

---

## 4. Database Setup & Seeding

When you deploy your cloud database (e.g. Supabase/Neon), the backend will automatically initialize all tables (users, orders, reviews, restaurants, menu_items) and run the premium Unsplash data seeder on its first startup.

If you ever need to reset and reseed your production database:
1. Temporarily connect to your production DB using `reset_db.js`.
2. Or execute `node reset_db.js` on your backend server terminal (using Render Shell / Heroku CLI).
3. The server will reseed the database automatically on the next launch.
