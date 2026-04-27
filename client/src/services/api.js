import axios from 'axios';
import { apiBaseUrl } from '../utils/runtimeConfig';

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Note: We don't necessarily redirect here because AuthContext
      // will detect the null user/token and handle it via ProtectedRoute.
    }
    return Promise.reject(error);
  }
);

export default api;
