import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// إضافة Token تلقائياً لكل طلب
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

// معالجة الأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.patch('/auth/change-password', data)
};

// Affiliate
export const affiliate = {
  getDashboard: () => api.get('/affiliate/dashboard'),
  getProducts: () => api.get('/affiliate/products'),
  getOrders: (params) => api.get('/affiliate/orders', { params }),
  getWithdrawals: () => api.get('/affiliate/withdrawals'),
  requestWithdrawal: (data) => api.post('/affiliate/withdrawals', data)
};

// Products (public)
export const products = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`)
};

export default api;
