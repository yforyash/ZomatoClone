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

export async function registerUser(name, email, passwordHash, role, restaurantId) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, passwordHash, role, restaurantId }),
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

export async function fetchAddresses() {
  const res = await fetch(`${BASE_URL}/user/addresses`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function addAddress(address_line, latitude, longitude) {
  const res = await fetch(`${BASE_URL}/user/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify({ address_line, latitude, longitude })
  });
  return await res.json();
}

export async function deleteAddress(id) {
  const res = await fetch(`${BASE_URL}/user/addresses/${id}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function fetchFavorites() {
  const res = await fetch(`${BASE_URL}/user/favorites`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function toggleFavorite(restaurant_id) {
  const res = await fetch(`${BASE_URL}/user/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify({ restaurant_id })
  });
  return await res.json();
}

export async function checkFavorite(restaurantId) {
  const res = await fetch(`${BASE_URL}/user/favorites/${restaurantId}`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function fetchRestaurantStats() {
  const res = await fetch(`${BASE_URL}/orders/restaurant-stats`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function requestWithdrawal(amount, paymentMethod, details) {
  const res = await fetch(`${BASE_URL}/orders/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify({ amount, paymentMethod, details })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Withdrawal failed');
  return data;
}

export async function fetchAdminStats() {
  const res = await fetch(`${BASE_URL}/orders/admin-stats`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function fetchWallet() {
  const res = await fetch(`${BASE_URL}/user/wallet`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function addWalletFunds(amount) {
  const res = await fetch(`${BASE_URL}/user/wallet/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify({ amount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add funds.');
  return data;
}

export async function fetchTickets() {
  const res = await fetch(`${BASE_URL}/user/tickets`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function createTicket(subject, message) {
  const res = await fetch(`${BASE_URL}/user/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify({ subject, message })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to file support ticket.');
  return data;
}

export async function fetchAdminTickets() {
  const res = await fetch(`${BASE_URL}/admin/tickets`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function resolveTicket(id) {
  const res = await fetch(`${BASE_URL}/admin/tickets/${id}/resolve`, {
    method: 'POST',
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function assignRider(orderId, riderName, riderPhone, riderVehicle) {
  const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/assign-rider`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify({ riderName, riderPhone, riderVehicle })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reassign delivery rider.');
  return data;
}

export async function refundOrder(orderId) {
  const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/refund`, {
    method: 'POST',
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to process refund.');
  return data;
}

export async function fetchProfile() {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch profile.');
  return data;
}

export async function createRestaurant(restData) {
  const res = await fetch(`${BASE_URL}/restaurants/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify(restData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create restaurant.');
  return data;
}

export async function claimRestaurant(restaurantId) {
  const res = await fetch(`${BASE_URL}/restaurants/${restaurantId}/claim`, {
    method: 'POST',
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to claim restaurant.');
  return data;
}

export async function addRestaurantDish(restaurantId, dishData) {
  const res = await fetch(`${BASE_URL}/restaurants/${restaurantId}/dishes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify(dishData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add dish.');
  return data;
}

export async function fetchPendingDishes() {
  const res = await fetch(`${BASE_URL}/admin/pending-dishes`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  return await res.json();
}

export async function updateDishStatus(dishId, status) {
  const res = await fetch(`${BASE_URL}/admin/dishes/${dishId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update dish status.');
  return data;
}

export async function fetchSystemAnalytics() {
  const res = await fetch(`${BASE_URL}/admin/analytics`, {
    headers: {
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics.');
  return data;
}

export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('z_user') 
        ? JSON.parse(localStorage.getItem('z_user')).id 
        : 'Anonymous'
    },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update order status.');
  return data;
}

