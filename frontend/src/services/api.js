import axios from 'axios';

const api = axios.create({
  // Use VITE_API_URL from environment variables, fallback to localhost for dev
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (credentials) => api.post('/login', credentials);
export const logout = () => api.post('/admin/logout');

// Products
export const getProducts = () => api.get('/products');

// Orders
export const createOrder = (orderData) => api.post('/orders', orderData);
export const getOrder = (orderNumber) => api.get(`/orders/${orderNumber}`);
export const cancelOrder = (orderNumber) => api.post(`/orders/${orderNumber}/cancel`);
export const getQueue = () => api.get('/queue');

// Admin - Orders
export const getAdminOrders = (status = 'all') => api.get(`/admin/orders?status=${status}`);
export const updateOrderStatus = (id, status, pin = null) => api.put(`/admin/orders/${id}/status`, { status, pin });

// Admin - Products
export const getAdminProducts = () => api.get('/admin/products');
export const createProduct = (productData) => api.post('/admin/products', productData);
export const updateProduct = (id, productData) => api.put(`/admin/products/${id}`, productData);
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`);

export default api;
