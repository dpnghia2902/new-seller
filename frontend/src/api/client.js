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

// Review API
export const reviewAPI = {
  createReview: (data) => api.post('/reviews', data),
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  getShopReviews: (shopId, params) => api.get(`/reviews/shop/${shopId}`, { params }),
  getBuyerReviews: () => api.get('/reviews/buyer/my-reviews'),
  getSellerReviews: () => api.get('/reviews/seller/my-reviews'),
  updateReview: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
  respondToReview: (reviewId, data) => api.post(`/reviews/${reviewId}/respond`, data),
  voteReview: (reviewId) => api.post(`/reviews/${reviewId}/vote`),
};

// Complaints API
export const complaintsAPI = {
  list: (params) => api.get('/complaints', { params }),
  get: (id) => api.get(`/complaints/${id}`),
  action: (id, data) => api.patch(`/complaints/${id}/action`, data),
  uploadEvidence: (id, files) => {
    const form = new FormData();
    [...files].forEach((f) => form.append('files', f));
    return api.post(`/complaints/${id}/evidence`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;