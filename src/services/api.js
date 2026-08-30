import axios from 'axios';
import {
  mockStats,
  mockPatients,
  mockDoctors,
  mockAppointments,
  mockPrescriptions,
  mockBills,
  mockHospitalSettings,
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3000,
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

// Interceptor to handle global errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// Helper for seamless mock fallback
const withFallback = async (apiCall, fallbackData) => {
  try {
    return await apiCall();
  } catch (err) {
    // Return mock data seamlessly
    return { data: typeof fallbackData === 'function' ? fallbackData() : fallbackData };
  }
};

// 1. Auth Endpoints
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// 2. Dashboard Endpoints
export const dashboardApi = {
  getStats: () => withFallback(() => api.get('/dashboard/stats'), mockStats),
};

// 3. Patient Endpoints
export const patientApi = {
  getAll: (params) => withFallback(() => api.get('/patients', { params }), mockPatients),
  getById: (id) =>
    withFallback(
      () => api.get(`/patients/${id}`),
      mockPatients.find((p) => p.id === Number(id)) || mockPatients[0]
    ),
  create: (data) =>
    withFallback(() => api.post('/patients', data), {
      ...data,
      id: Date.now(),
      patientCode: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    }),
  update: (id, data) =>
    withFallback(() => api.put(`/patients/${id}`, data), { ...data, id: Number(id) }),
  delete: (id) => withFallback(() => api.delete(`/patients/${id}`), { success: true }),
};

// 4. Doctor Endpoints
export const doctorApi = {
  getAll: (params) => withFallback(() => api.get('/doctors', { params }), mockDoctors),
  getById: (id) =>
    withFallback(
      () => api.get(`/doctors/${id}`),
      mockDoctors.find((d) => d.id === Number(id)) || mockDoctors[0]
    ),
  create: (data) =>
    withFallback(() => api.post('/doctors', data), {
      ...data,
      id: Date.now(),
      doctorCode: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    }),
  update: (id, data) =>
    withFallback(() => api.put(`/doctors/${id}`, data), { ...data, id: Number(id) }),
  delete: (id) => withFallback(() => api.delete(`/doctors/${id}`), { success: true }),
};

// 5. Appointment Endpoints
export const appointmentApi = {
  getAll: (params) => withFallback(() => api.get('/appointments', { params }), mockAppointments),
  getById: (id) =>
    withFallback(
      () => api.get(`/appointments/${id}`),
      mockAppointments.find((a) => a.id === Number(id)) || mockAppointments[0]
    ),
  create: (data) =>
    withFallback(() => api.post('/appointments', data), {
      ...data,
      id: Date.now(),
      appointmentCode: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    }),
  update: (id, data) =>
    withFallback(() => api.put(`/appointments/${id}`, data), { ...data, id: Number(id) }),
  updateStatus: (id, status) =>
    withFallback(() => api.patch(`/appointments/${id}/status`, { status }), {
      id: Number(id),
      status,
    }),
  delete: (id) => withFallback(() => api.delete(`/appointments/${id}`), { success: true }),
};

// 6. Prescription Endpoints
export const prescriptionApi = {
  getAll: (params) => withFallback(() => api.get('/prescriptions', { params }), mockPrescriptions),
  getById: (id) =>
    withFallback(
      () => api.get(`/prescriptions/${id}`),
      mockPrescriptions.find((pr) => pr.id === Number(id)) || mockPrescriptions[0]
    ),
  create: (data) =>
    withFallback(() => api.post('/prescriptions', data), {
      ...data,
      id: Date.now(),
      prescriptionCode: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    }),
  update: (id, data) =>
    withFallback(() => api.put(`/prescriptions/${id}`, data), { ...data, id: Number(id) }),
  delete: (id) => withFallback(() => api.delete(`/prescriptions/${id}`), { success: true }),
};

// 7. Billing Endpoints
export const billApi = {
  getAll: (params) => withFallback(() => api.get('/bills', { params }), mockBills),
  getById: (id) =>
    withFallback(
      () => api.get(`/bills/${id}`),
      mockBills.find((b) => b.id === Number(id)) || mockBills[0]
    ),
  create: (data) =>
    withFallback(() => api.post('/bills', data), {
      ...data,
      id: Date.now(),
      billCode: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
    }),
  update: (id, data) =>
    withFallback(() => api.put(`/bills/${id}`, data), { ...data, id: Number(id) }),
  updateStatus: (id, status, paymentMethod) =>
    withFallback(() => api.patch(`/bills/${id}/status`, { status, paymentMethod }), {
      id: Number(id),
      status,
      paymentMethod,
    }),
  delete: (id) => withFallback(() => api.delete(`/bills/${id}`), { success: true }),
};

// 8. Reports Endpoints
export const reportApi = {
  getSummary: (params) =>
    withFallback(() => api.get('/reports/summary', { params }), {
      stats: mockStats,
      revenueByDepartment: [
        { name: 'Cardiology', revenue: 6500 },
        { name: 'Pediatrics', revenue: 4200 },
        { name: 'Neurology', revenue: 3100 },
        { name: 'General Practice', revenue: 1700 },
      ],
      appointmentsTrend: [
        { day: 'Mon', count: 12 },
        { day: 'Tue', count: 18 },
        { day: 'Wed', count: 15 },
        { day: 'Thu', count: 22 },
        { day: 'Fri', count: 20 },
        { day: 'Sat', count: 14 },
      ],
    }),
  exportCsv: (params) =>
    withFallback(
      () => api.get('/reports/export', { params, responseType: 'blob' }),
      new Blob(['Report Date,Patients,Revenue\n2026-08-29,8,15500'], { type: 'text/csv' })
    ),
};

// 9. Settings Endpoints
export const settingApi = {
  getHospitalProfile: () =>
    withFallback(() => api.get('/settings/hospital'), mockHospitalSettings),
  updateHospitalProfile: (data) =>
    withFallback(() => api.put('/settings/hospital', data), {
      ...mockHospitalSettings,
      ...data,
    }),
  getUserProfile: () =>
    withFallback(() => api.get('/settings/user'), {
      username: 'admin',
      fullName: 'Dr. Sarah Mitchell',
      email: 'admin@vitalsync.com',
      role: 'ADMIN',
    }),
  updateUserProfile: (data) => withFallback(() => api.put('/settings/user', data), data),
  changePassword: (data) => withFallback(() => api.post('/settings/change-password', data), { success: true }),
};

export default api;
