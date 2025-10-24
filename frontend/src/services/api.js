import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Customer APIs
export const customerAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
};

// Product APIs
export const productAPI = {
  getAll: (type) => api.get('/products', { params: { type } }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  updateInventory: (id, current) => api.patch(`/products/${id}/inventory`, { current }),
  adjustInventory: (id, data) => api.post(`/products/${id}/adjust-inventory`, data),
  getAdjustmentHistory: (id) => api.get(`/products/${id}/adjustment-history`),
  delete: (id) => api.delete(`/products/${id}`)
};

// Order APIs
export const orderAPI = {
  getAll: (filters) => api.get('/orders', { params: filters }),
  getStats: () => api.get('/orders/stats'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateItemQuantity: (orderId, itemId, data) => api.patch(`/orders/${orderId}/items/${itemId}/quantity`, data),
  delete: (id) => api.delete(`/orders/${id}`)
};

// Stock Order APIs
export const stockOrderAPI = {
  getAll: (filters) => api.get('/stock-orders', { params: filters }),
  getStats: () => api.get('/stock-orders/stats'),
  getById: (id) => api.get(`/stock-orders/${id}`),
  create: (data) => api.post('/stock-orders', data),
  update: (id, data) => api.put(`/stock-orders/${id}`, data),
  updateItemQuantity: (orderId, itemId, data) => api.patch(`/stock-orders/${orderId}/items/${itemId}/quantity`, data),
  delete: (id) => api.delete(`/stock-orders/${id}`)
};

// Shipment APIs
export const shipmentAPI = {
  getAll: (orderId) => api.get('/shipments', { params: { orderId } }),
  getById: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data)
};

// Stock Shipment APIs
export const stockShipmentAPI = {
  getAll: (stockOrderId) => api.get('/stock-shipments', { params: { stockOrderId } }),
  getById: (id) => api.get(`/stock-shipments/${id}`),
  create: (data) => api.post('/stock-shipments', data)
};

// Production APIs
export const productionAPI = {
  getPlan: () => api.get('/production/plan')
};

export default api;

