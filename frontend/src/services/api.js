import axios from 'axios';

// Set to true to force mock mode (no backend required)
export const USE_MOCK = !import.meta.env.VITE_API_URL && false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ssp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ssp_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
