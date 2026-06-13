# Zomato Clone 🍕🍔

A premium, full-stack food ordering and delivery web application built using **React.js, Node.js, Express, and PostgreSQL (Supabase)**. This project includes high-quality food imagery, secure payment gateway integrations with interactive fallbacks, real-time rider tracking using Server-Sent Events, and clean checkout input masking.

---

## 🚀 Key Features Implemented

*   **Premium Visual Assets**: Replaced placeholder image seeds with curated food and restaurant photos from Unsplash, dynamically mapped to specific categories (Indian, Italian, South Indian, Desserts, Burgers, etc.) across **200+ restaurants, 4,000+ dishes, and 1,500+ reviews**.
*   **Dual Payment Gateways with Sandbox Fallbacks**:
    *   **Stripe Checkout**: Generates checkout sessions for secure card payments.
    *   **Razorpay Overlay**: Integrates Razorpay's checkout script for UPI apps.
    *   **Interactive Simulation Overlays**: When backend API keys are absent, the application opens custom simulated gateways (a mock **Razorpay UPI Modal** requesting a 4-6 digit UPI PIN, and a mock **Bank 3D-Secure Portal** requesting a 6-digit SMS OTP) to provide a realistic end-to-end checkout experience in development.
*   **Secure Input Masking & Constraints**:
    *   **Card Expiry (MM/YY)**: Auto-inserts the slash `/` while typing and cleanly handles backspacing without cursor locking.
    *   **Card Number**: Formats digits into blocks of 4 separated by spaces (`XXXX XXXX XXXX XXXX`) up to 16 digits.
    *   **Validation Rules**: Blocks non-numeric keys on CVV/Phone/Card, blocks digit entry in the Name field, and binds checks conditionally using Formik and Yup.
*   **Real-time Order Tracking & Universal Map**:
    *   Powered by **Server-Sent Events (SSE)**, streaming coordinates and status steps ("Preparing Food", "Out for Delivery", "Delivered") from the backend.
    *   Dynamic route mapping rendering a dual-API Leaflet wrapper fallback when Google Maps API keys are not supplied.
*   **SMTP Mail Service**:
    *   Uses Nodemailer to send password reset links dynamically pointing to the deployed domain, falling back to secure console logger simulations in local test environments.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, Vite, Formik, Yup, Leaflet, Recharts, Canvas-Confetti, Lucide Icons
*   **Backend**: Node.js, Express.js, PostgreSQL (pg client pool), Nodemailer, Stripe, Razorpay
*   **Database**: Supabase PostgreSQL Cloud instance (migrated, SSL-enabled, and bulk-seeded)

---

## 📦 Project Structure

```
zomato-clone/
├── package.json                    # Workspace scripts (install-all, dev)
├── backend/
│   ├── server.js                   # Node entry point & DB schema initializer
│   ├── config/
│   │   ├── db.js                   # Connection Pool (SSL enabled)
│   │   └── seed.js                 # Image-curated bulk seeder script
│   ├── controllers/
│   │   ├── authController.js       # Forgot/Reset & JWT Login handlers
│   │   └── orderController.js      # Order checkout sessions & SSE rider tracker
│   └── routes/                     # Router paths (auth, restaurants, reviews, orders)
└── frontend/
    ├── src/
    │   ├── context/CartContext.jsx # Shopping Cart state provider
    │   ├── components/             # Navbar, skeletons, Universal Map wrapper
    │   └── pages/                  # Home, RestaurantDetail, Checkout, Analytics
```

---

## ⚙️ Setup & Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/yforyash/zomato-clone.git
    cd zomato-clone
    ```

2.  **Install Dependencies**:
    ```bash
    npm run install-all
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the `backend/` directory:
    ```env
    PORT=5001
    DATABASE_URL=your_supabase_postgresql_connection_string
    FRONTEND_URL=http://localhost:5173
    
    # Optional Real Gateway Keys (falls back to interactive mocks if empty)
    STRIPE_SECRET_KEY=
    RAZORPAY_KEY_ID=
    RAZORPAY_KEY_SECRET=
    
    # SMTP Mailer (falls back to console logs if empty)
    SMTP_HOST=
    SMTP_PORT=
    SMTP_USER=
    SMTP_PASS=
    ```

4.  **Run Locally**:
    ```bash
    npm run dev
    ```
    This starts the frontend on `http://localhost:5173` and backend on `http://localhost:5001` concurrently.

---

## ☁️ Deployment

For step-by-step instructions on deploying the frontend to **Vercel** and the backend to **Render**, please refer to the [README_DEPLOYMENT.md](README_DEPLOYMENT.md) file.
