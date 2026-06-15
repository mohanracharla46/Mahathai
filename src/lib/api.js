const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const buildUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}/api${normalizedPath}`;
};

const withQuery = (path, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
};

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const validationMessage = payload?.errors
      ? Object.values(payload.errors).flat().find(Boolean)
      : null;
    const message = validationMessage || payload?.message || payload || `API request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
};

const post = (path, payload) => apiRequest(path, {
  method: 'POST',
  body: JSON.stringify(payload),
});

const patch = (path, payload) => apiRequest(path, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});

const put = (path, payload) => apiRequest(path, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

const destroy = (path) => apiRequest(path, {
  method: 'DELETE',
});

export const getUsers = () => apiRequest('/users');
export const createUser = (payload) => post('/users', payload);
export const updateUser = (id, payload) => patch(`/users/${id}`, payload);

export const getMenuCategories = () => apiRequest('/menu-categories');
export const createMenuCategory = (payload) => post('/menu-categories', payload);

export const getMenuItems = () => apiRequest('/menu-items');
export const createMenuItem = (payload) => post('/menu-items', payload);
export const updateMenuItem = (id, payload) => patch(`/menu-items/${id}`, payload);
export const deleteMenuItem = (id) => destroy(`/menu-items/${id}`);
export const uploadMenuItemImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(buildUrl('/menu-items/upload-image'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || `Image upload failed: ${response.status}`);
  }

  return payload;
};

export const getCarts = () => apiRequest('/carts');
export const createCart = (payload) => post('/carts', payload);

export const getCartItems = () => apiRequest('/cart-items');
export const createCartItem = (payload) => post('/cart-items', payload);

export const getOrders = (params = {}) => apiRequest(withQuery('/orders', params));
export const createOrder = (payload) => post('/orders', payload);
export const updateOrder = (id, payload) => patch(`/orders/${id}`, payload);
export const deleteOrder = (id) => destroy(`/orders/${id}`);
export const dispatchOrder = (id) => post(`/orders/${id}/dispatch`, {});
export const retryOrderDispatch = (id) => post(`/orders/${id}/dispatch/retry`, {});
export const cancelOrderDelivery = (id) => post(`/orders/${id}/delivery/cancel`, {});

export const getRewards = () => apiRequest('/rewards');
export const getUserRewards = (userId) => apiRequest(`/rewards/user/${userId}`);
export const redeemReward = (userId, payload) => post(`/rewards/user/${userId}/redeem`, payload);

export const getOrderItems = () => apiRequest('/order-items');
export const createOrderItem = (payload) => post('/order-items', payload);
export const bulkCreateOrderItemAddons = (orderItemId, payload) => post(`/order-items/${orderItemId}/addons`, payload);
export const createOrderItemSize = async (orderItemId, payload) => {
  const payloadWithOrderItemId = { order_item_id: orderItemId, ...payload };
  const attempts = [
    () => post(`/order-items/${orderItemId}/size`, payload),
    () => post(`/order-items/${orderItemId}/sizes`, payload),
    () => post('/order-item-sizes', payloadWithOrderItemId),
  ];

  let lastError;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (!/404|not found|not be found|could not be found|405|method/i.test(error.message || '')) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const getPromoCodes = () => apiRequest('/promo-codes');
export const createPromoCode = (payload) => post('/promo-codes', payload);

export const getReservations = (params = {}) => apiRequest(withQuery('/reservations', params));
export const createReservation = (payload) => post('/reservations', payload);
export const updateReservation = (id, payload) => patch(`/reservations/${id}`, payload);

export const getContactMessages = () => apiRequest('/contact-messages');
export const createContactMessage = (payload) => post('/contact-messages', payload);
export const updateContactMessage = async (id, payload) => {
  const payloadWithId = { id, ...payload };
  const updateAttempts = [
    () => patch(`/contact-messages/${id}/status`, payload),
    () => put(`/contact-messages/${id}/status`, payload),
    () => post(`/contact-messages/${id}/status`, payload),
    () => patch('/contact-messages/status', payloadWithId),
    () => put('/contact-messages/status', payloadWithId),
    () => post('/contact-messages/status', payloadWithId),
    () => patch(`/contact-messages/${id}`, payload),
    () => put(`/contact-messages/${id}`, payload),
  ];

  let lastError;

  for (const attempt of updateAttempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (!/404|not found|not be found|could not be found|405|method/i.test(error.message || '')) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const getFeedback = (params = {}) => apiRequest(withQuery('/feedback', params));
export const createFeedback = (payload) => post('/feedback', payload);
export const getConciergeInquiries = (params = {}) => apiRequest(withQuery('/concierge-support', params));
export const createConciergeInquiry = (payload) => post('/concierge-support', payload);
export const updateConciergeInquiry = (id, payload) => patch(`/concierge-support/${id}`, payload);

export const getCareerApplications = () => apiRequest('/career-applications');
export const createCareerApplication = (payload) => post('/career-applications', payload);
export const updateCareerApplication = async (id, payload) => {
  const payloadWithId = { id, ...payload };
  const updateAttempts = [
    () => patch(`/career-applications/${id}/status`, payload),
    () => put(`/career-applications/${id}/status`, payload),
    () => post(`/career-applications/${id}/status`, payload),
    () => patch('/career-applications/status', payloadWithId),
    () => put('/career-applications/status', payloadWithId),
    () => post('/career-applications/status', payloadWithId),
    () => patch(`/career-applications/${id}`, payload),
    () => put(`/career-applications/${id}`, payload),
  ];

  let lastError;

  for (const attempt of updateAttempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (!/404|not found|not be found|could not be found|405|method/i.test(error.message || '')) {
        throw error;
      }
    }
  }

  throw lastError;
};
export const getCareerPositions = (params = {}) => apiRequest(withQuery('/career-positions', params));

export const getNewsletterSubscriptions = () => apiRequest('/newsletter-subscriptions');
export const createNewsletterSubscription = (payload) => post('/newsletter-subscriptions', payload);

export const getGiftCards = () => apiRequest('/gift-cards');
export const createGiftCard = (payload) => post('/gift-cards', payload);

export const isAdminUser = (user) => {
  const role = String(user?.role || '').toLowerCase();
  return role === 'admin' || user?.email === 'admin@mahathai.com';
};
