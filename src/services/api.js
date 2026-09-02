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
      const isLoginRequest = error.config?.url?.includes('/auth/login') ||
                             error.config?.url?.includes('/auth/register') ||
                             error.config?.url?.includes('/auth/forgot-password');
      if (!isLoginRequest) {
        localStorage.removeItem('vitalsync_token');
        localStorage.removeItem('vitalsync_user');
        if (window.location.pathname.startsWith('/patient') ||
            window.location.pathname.startsWith('/doctor') ||
            window.location.pathname.startsWith('/admin') ||
            window.location.pathname.startsWith('/dashboard')) {
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
  register: (patientData) => api.post('/auth/register', patientData),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// 2. Public Endpoints (Unauthenticated)
export const publicApi = {
  getHospitalInfo: () => api.get('/public/hospital-info'),
  getDoctors: () => api.get('/public/doctors'),
  getDoctorById: (id) => api.get(`/public/doctors/${id}`),
  getDoctorAvailability: (id, date) => api.get(`/public/doctors/${id}/availability`, { params: { date } }),
  getDepartments: () => api.get('/public/departments'),
  getBedAvailability: () => api.get('/public/beds/availability'),
};

// 3. Patient Self-Service Portal Endpoints (JWT isolated)
export const patientPortalApi = {
  getDashboard: () => api.get('/patient/dashboard'),
  getProfile: () => api.get('/patient/profile'),
  updateProfile: (data) => api.put('/patient/profile', data),
  getAppointments: (params) => api.get('/patient/appointments', { params }),
  bookAppointment: (data) => api.post('/patient/appointments', data),
  cancelAppointment: (id) => api.patch(`/patient/appointments/${id}/cancel`),
  getPrescriptions: () => api.get('/patient/prescriptions'),
  getPrescriptionById: (id) => api.get(`/patient/prescriptions/${id}`),
  getReports: () => api.get('/patient/reports'),
  getReportById: (id) => api.get(`/patient/reports/${id}`),
  getBills: () => api.get('/patient/bills'),
  getBillById: (id) => api.get(`/patient/bills/${id}`),
  getBedReservations: () => api.get('/patient/bed-reservations'),
  bookBedReservation: (data) => api.post('/patient/bed-reservations', data),
};

// 4. Doctor Portal Endpoints (JWT isolated)
export const doctorPortalApi = {
  getDashboard: () => api.get('/doctor/dashboard'),
  getAppointments: (params) => api.get('/doctor/appointments', { params }),
  getPatients: () => api.get('/doctor/patients'),
  getProfile: () => api.get('/doctor/profile'),
  updateProfile: (data) => api.put('/doctor/profile', data),
};

// 5. Dashboard Endpoints (Admin & Staff)
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// 6. Departments Management
export const departmentApi = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// 7. Bed & ICU Management
export const bedApi = {
  getAllBeds: (params) => api.get('/beds', { params }),
  getBedById: (id) => api.get(`/beds/${id}`),
  createBed: (data) => api.post('/beds', data),
  updateBed: (id, data) => api.put(`/beds/${id}`, data),
  updateBedStatus: (id, status, patientId) => api.patch(`/beds/${id}/status`, { status, patientId }),
  deleteBed: (id) => api.delete(`/beds/${id}`),
  // Reservations
  getAllReservations: (params) => api.get('/beds/reservations', { params }),
  createReservation: (data) => api.post('/beds/reservations', data),
  updateReservationStatus: (id, status, notes) => api.patch(`/beds/reservations/${id}/status`, { status, notes }),
};

// 8. Medical Reports (Staff)
export const medicalReportApi = {
  getAll: (params) => api.get('/medical-reports', { params }),
  getById: (id) => api.get(`/medical-reports/${id}`),
  create: (data) => api.post('/medical-reports', data),
  update: (id, data) => api.put(`/medical-reports/${id}`, data),
  delete: (id) => api.delete(`/medical-reports/${id}`),
};

// 9. Admin User Management & Audit Logs
export const userManagementApi = {
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createStaffAccount: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  resetUserPassword: (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

// 10. Patient Endpoints (Staff CRUD)
export const patientApi = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

// 11. Doctor Endpoints (Staff CRUD)
export const doctorApi = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getAvailability: (id, date) => api.get(`/doctors/${id}/availability`, { params: { date } }),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

// 12. Appointment Endpoints (Staff CRUD)
export const appointmentApi = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
  delete: (id) => api.delete(`/appointments/${id}`),
};

// 13. Prescription Endpoints (Staff CRUD)
export const prescriptionApi = {
  getAll: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
  delete: (id) => api.delete(`/prescriptions/${id}`),
};

// 14. Billing Endpoints (Staff CRUD)
export const billApi = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  updateStatus: (id, status, paymentMethod) =>
    api.patch(`/bills/${id}/status`, { status, paymentMethod }),
  delete: (id) => api.delete(`/bills/${id}`),
};

// 15. Reports Endpoints (Admin Analytics)
export const reportApi = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  exportCsv: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};

// 16. Settings Endpoints
export const settingApi = {
  getHospitalProfile: () => api.get('/settings/hospital'),
  updateHospitalProfile: (data) => api.put('/settings/hospital', data),
  getUserProfile: () => api.get('/settings/user'),
  updateUserProfile: (data) => api.put('/settings/user', data),
  changePassword: (data) => api.post('/settings/change-password', data),
};

// 17. Centralized Database Search Endpoints
export const searchApi = {
  globalSearch: (query) => api.get('/search', { params: { query } }),
  searchUsers: (query) => api.get('/users/search', { params: { query } }),
  searchPatients: (query) => api.get('/patients/search', { params: { query } }),
  searchDoctors: (query) => api.get('/doctors/search', { params: { query } }),
  searchAppointments: (query) => api.get('/appointments/search', { params: { query } }),
  searchPrescriptions: (query) => api.get('/prescriptions/search', { params: { query } }),
  searchBills: (query) => api.get('/bills/search', { params: { query } }),
};

export default api;

