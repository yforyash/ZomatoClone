const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

export async function fetchRestaurants(page = 1, search = '', veg = false) {
  let url = `${BASE_URL}/restaurants?page=${page}&limit=6`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (veg) url += `&veg=true`;
  
  const res = await fetch(url);
  return await res.json();
}

export async function fetchRestaurantDetails(id) {
  const res = await fetch(`${BASE_URL}/restaurants/${id}`);
  return await res.json();
}

export async function fetchRestaurantMenu(id) {
  const res = await fetch(`${BASE_URL}/restaurants/${id}/menu`);
  return await res.json();
}

export async function fetchReviews(restaurantId) {
  const res = await fetch(`${BASE_URL}/reviews/${restaurantId}`);
  return await res.json();
}

export async function postReview(restaurantId, reviewer_name, rating, comment, tags) {
  const res = await fetch(`${BASE_URL}/reviews/${restaurantId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer_name, rating, comment, tags }),
  });
  return await res.json();
}

export async function postOrder(orderData) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify(orderData),
  });
  return await res.json();
}

export async function fetchOrders() {
  const res = await fetch(`${BASE_URL}/orders`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function loginUser(email, passwordHash) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, passwordHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerUser(name, email, passwordHash) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, passwordHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function forgotPassword(email) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Reset request failed');
  return data;
}

export async function resetPassword(email, token, newPasswordHash) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, newPasswordHash }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Password update failed');
  return data;
}

export async function createStripeSession(orderData) {
  const res = await fetch(`${BASE_URL}/orders/create-checkout-session`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify(orderData),
  });
  return await res.json();
}

export async function confirmStripePayment(sessionId, orderId) {
  const res = await fetch(`${BASE_URL}/orders/confirm-payment`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify({ sessionId, orderId }),
  });
  return await res.json();
}
