import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const auth = JSON.parse(localStorage.getItem('primeshop-auth') || '{}');
    if (auth?.state?.token) config.headers.Authorization = `Bearer ${auth.state.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('primeshop-auth');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

export default api;