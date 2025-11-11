import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Shop API
export const shopAPI = {
  createShop: (data) => api.post('/shops/create', data),
  getMyShop: () => api.get('/shops/my-shop'),
  getShop: (shopId) => api.get(`/shops/${shopId}`),
  updateShop: (data) => api.put('/shops/update', data),
  getAllShops: () => api.get('/shops/all'),
};

// Product API
export const productAPI = {
  createProduct: (data) => api.post('/products/create', data),
  getMyProducts: () => api.get('/products/my-products'),
  getAllProducts: (params) => api.get('/products/all', { params }),
  getProduct: (productId) => api.get(`/products/${productId}`),
  updateProduct: (productId, data) => api.put(`/products/${productId}`, data),
  deleteProduct: (productId) => api.delete(`/products/${productId}`),
  getShopProducts: (shopId) => api.get(`/products/shop/${shopId}`),
};

// Order API
export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/seller/my-orders'),
  getBuyerOrders: () => api.get('/orders/buyer/my-orders'),
  getOrder: (orderId) => api.get(`/orders/${orderId}`),
  updateOrderStatus: (orderId, data) => api.patch(`/orders/${orderId}/status`, data),
  cancelOrder: (orderId) => api.patch(`/orders/${orderId}/cancel`),
};

// Coupon API
export const couponAPI = {
  createCoupon: (data) => api.post('/coupons', data),
  getMyCoupons: () => api.get('/coupons/my-coupons'),
  getCoupon: (couponId) => api.get(`/coupons/${couponId}`),
  updateCoupon: (couponId, data) => api.put(`/coupons/${couponId}`, data),
  deleteCoupon: (couponId) => api.delete(`/coupons/${couponId}`),
  validateCoupon: (data) => api.post('/coupons/validate', data),
};

// Verification API
export const verificationAPI = {
  submitVerification: (data) => api.post('/verification/submit', data),
  getMyVerification: () => api.get('/verification/my-verification'),
  getAllVerifications: (params) => api.get('/verification', { params }),
  getVerificationById: (id) => api.get(`/verification/${id}`),
  approveVerification: (id, data) => api.put(`/verification/${id}/approve`, data),
  rejectVerification: (id, data) => api.put(`/verification/${id}/reject`, data),
  deleteVerification: (id) => api.delete(`/verification/${id}`),
};

// Shipping API
export const shippingAPI = {
  getShippingLabel: (orderId) => api.get(`/shipping/label/${orderId}`),
  printShippingLabel: (orderId) => `${API_BASE_URL}/shipping/label/${orderId}/print`,
};

// Error Logs API (Admin)
export const errorLogAPI = {
  getErrorLogs: (params) => api.get('/error-logs', { params }),
  getErrorLog: (id) => api.get(`/error-logs/${id}`),
  resolveErrorLog: (id, data) => api.put(`/error-logs/${id}/resolve`, data),
  deleteErrorLogs: (ids) => api.delete('/error-logs/bulk', { data: { ids } }),
  getStatsByContext: (params) => api.get('/error-logs/stats/context', { params }),
  getTimeline: (params) => api.get('/error-logs/stats/timeline', { params }),
};

export default api;
