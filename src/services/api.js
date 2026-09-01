import axios from 'axios';

// In development (Vite dev server), use '/api' which is proxied to localhost:8080.
// In production (Vercel), use the full Render backend URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://vitalsync-hms-backend.onrender.com/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor to attach JWT token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vitalsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — check if not on login page
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        // Clear stale auth state
        localStorage.removeItem('vitalsync_token');
        localStorage.removeItem('vitalsync_user');
        // Redirect to login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// 1. Auth Endpoints
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// 2. Dashboard Endpoints
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// 3. Patient Endpoints
export const patientApi = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

// 4. Doctor Endpoints
export const doctorApi = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

// 5. Appointment Endpoints
export const appointmentApi = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
  delete: (id) => api.delete(`/appointments/${id}`),
};

// 6. Prescription Endpoints
export const prescriptionApi = {
  getAll: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
  delete: (id) => api.delete(`/prescriptions/${id}`),
};

// 7. Billing Endpoints
export const billApi = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  updateStatus: (id, status, paymentMethod) =>
    api.patch(`/bills/${id}/status`, { status, paymentMethod }),
  delete: (id) => api.delete(`/bills/${id}`),
};

// 8. Reports Endpoints
export const reportApi = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  exportCsv: (params) =>
    api.get('/reports/export', { params, responseType: 'blob' }),
};

// 9. Settings Endpoints
export const settingApi = {
  getHospitalProfile: () => api.get('/settings/hospital'),
  updateHospitalProfile: (data) => api.put('/settings/hospital', data),
  getUserProfile: () => api.get('/settings/user'),
  updateUserProfile: (data) => api.put('/settings/user', data),
  changePassword: (data) => api.post('/settings/change-password', data),
};

export default api;
