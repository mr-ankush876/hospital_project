import axios from 'axios';

// In development (Vite dev server) and production (Vercel), use '/api'.
// Development: Vite proxies '/api' -> http://localhost:8080.
// Production: vercel.json rewrites '/api' -> https://hospitalproject-production-b81f.up.railway.app/api.
const getApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof window !== 'undefined' && window.location.protocol === 'https:' && envUrl.startsWith('http:')) {
    envUrl = envUrl.replace('http:', 'https:');
  }
  return envUrl || '/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

import {
  FALLBACK_DOCTORS,
  FALLBACK_DEPARTMENTS,
  FALLBACK_BED_STATS,
  FALLBACK_BEDS_LIST,
} from '../config/hospitalFallbackData';

const INITIAL_USERS = [
  {
    id: 1,
    username: 'ankush_876',
    fullName: 'Dr. Ankush singh (Chief Medical Officer)',
    email: 'ankush@vitalsync.com',
    phone: '+91 98765 43210',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: 'receptionist',
    fullName: 'Alex Vance',
    email: 'receptionist@vitalsync.com',
    phone: '+91 98765 43211',
    role: 'RECEPTIONIST',
    status: 'ACTIVE',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 3,
    username: 'dr.chen',
    fullName: 'Dr. Robert Chen',
    email: 'r.chen@vitalsync.com',
    phone: '+91 98765 43212',
    role: 'DOCTOR',
    status: 'ACTIVE',
    lastLoginAt: new Date().toISOString(),
  },
];

export const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem('vitalsync_user_database');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  try {
    localStorage.setItem('vitalsync_user_database', JSON.stringify(INITIAL_USERS));
  } catch (e) {}
  return INITIAL_USERS;
};

export const saveStoredUsers = (usersList) => {
  try {
    localStorage.setItem('vitalsync_user_database', JSON.stringify(usersList));
  } catch (e) {}
};

const getFallbackDataForUrl = (url = '') => {
  if (!url) return null;
  const cleanUrl = url.split('?')[0];

  if (cleanUrl.includes('/dashboard/stats')) {
    return {
      totalPatients: 24,
      totalDoctors: 4,
      todayAppointments: 8,
      pendingBills: 3,
      totalRevenue: 125000,
      totalBeds: FALLBACK_BED_STATS.totalBeds,
      availableBeds: FALLBACK_BED_STATS.availableBeds,
      occupiedBeds: FALLBACK_BED_STATS.occupiedBeds,
      totalIcuBeds: FALLBACK_BED_STATS.totalIcuBeds,
      availableIcuBeds: FALLBACK_BED_STATS.availableIcuBeds,
      totalEmergencyBeds: FALLBACK_BED_STATS.totalEmergencyBeds,
      availableEmergencyBeds: FALLBACK_BED_STATS.availableEmergencyBeds,
      totalUsers: getStoredUsers().length,
      activeUsers: getStoredUsers().filter(u => u.status === 'ACTIVE').length,
    };
  }

  if (cleanUrl.includes('/doctors')) {
    return FALLBACK_DOCTORS;
  }

  if (cleanUrl.includes('/departments')) {
    return FALLBACK_DEPARTMENTS;
  }

  if (cleanUrl.includes('/beds/availability')) {
    return FALLBACK_BED_STATS;
  }

  if (cleanUrl.includes('/beds')) {
    return FALLBACK_BEDS_LIST;
  }

  if (cleanUrl.includes('/patients')) {
    return [
      {
        id: 1,
        patientCode: 'PT-1001',
        fullName: 'Michael Chang',
        email: 'm.chang@gmail.com',
        phone: '+91 98765 43210',
        gender: 'Male',
        bloodGroup: 'O+',
        dob: '1990-05-12',
        address: '12 Medical Park Road',
        status: 'Active',
        age: 34,
      },
      {
        id: 2,
        patientCode: 'PT-1002',
        fullName: 'Priya Sharma',
        email: 'priya.sharma@yahoo.com',
        phone: '+91 98765 43211',
        gender: 'Female',
        bloodGroup: 'A+',
        dob: '1994-08-22',
        address: '45 Lotus Avenue',
        status: 'Active',
        age: 30,
      },
      {
        id: 3,
        patientCode: 'PT-1003',
        fullName: 'Robert Johnson',
        email: 'r.johnson@outlook.com',
        phone: '+91 98765 43212',
        gender: 'Male',
        bloodGroup: 'B+',
        dob: '1985-11-30',
        address: '88 Tech Park Drive',
        status: 'Active',
        age: 39,
      },
    ];
  }

  if (cleanUrl.includes('/appointments')) {
    return [
      {
        id: 1,
        appointmentCode: 'APT-1001',
        patientName: 'Michael Chang',
        patientCode: 'PT-1001',
        doctorName: 'Dr. Robert Chen',
        doctorCode: 'DOC-2001',
        specialization: 'Cardiology',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00 AM',
        status: 'Confirmed',
        notes: 'Routine cardiovascular checkup',
      },
      {
        id: 2,
        appointmentCode: 'APT-1002',
        patientName: 'Priya Sharma',
        patientCode: 'PT-1002',
        doctorName: 'Dr. Emily Stanton',
        doctorCode: 'DOC-2002',
        specialization: 'Pediatrics',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '11:30 AM',
        status: 'Scheduled',
        notes: 'Pediatric consultation',
      },
    ];
  }

  if (cleanUrl.includes('/prescriptions')) {
    return [
      {
        id: 1,
        prescriptionCode: 'RX-1001',
        patientName: 'Michael Chang',
        patientCode: 'PT-1001',
        doctorName: 'Dr. Robert Chen',
        diagnosis: 'Essential Hypertension',
        medications: 'Amlodipine 5mg OD, Telmisartan 40mg OD',
        prescriptionDate: new Date().toISOString().split('T')[0],
      },
    ];
  }

  if (cleanUrl.includes('/bills')) {
    return [
      {
        id: 1,
        billCode: 'BILL-1001',
        patientName: 'Michael Chang',
        patientCode: 'PT-1001',
        doctorName: 'Dr. Robert Chen',
        consultationFee: 500.00,
        medicineCharges: 800.00,
        otherCharges: 200.00,
        discount: 0,
        totalAmount: 1500.00,
        paymentStatus: 'PAID',
        paymentMethod: 'UPI / Online',
        billDate: new Date().toISOString().split('T')[0],
      },
    ];
  }

  if (cleanUrl.includes('/medical-reports') || cleanUrl.includes('/reports')) {
    if (cleanUrl.includes('/reports/summary')) {
      return {
        totalRevenue: 125000,
        totalPatients: 24,
        totalAppointments: 32,
        totalBeds: 38,
        occupiedBeds: 10,
      };
    }
    return [
      {
        id: 1,
        reportCode: 'REP-1001',
        patientName: 'Michael Chang',
        patientCode: 'PT-1001',
        doctorName: 'Dr. Robert Chen',
        reportType: 'Complete Blood Count (CBC)',
        status: 'FINALIZED',
        reportDate: new Date().toISOString().split('T')[0],
      },
    ];
  }

  if (cleanUrl.includes('/audit-logs')) {
    return [
      {
        id: 1,
        username: 'ankush_876',
        role: 'ADMIN',
        action: 'SYSTEM_LOGIN',
        entityName: 'Auth',
        details: 'Administrator logged in to VitalSync HMS',
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        username: 'receptionist',
        role: 'RECEPTIONIST',
        action: 'REGISTER_PATIENT',
        entityName: 'Patient',
        details: 'Receptionist registered patient Michael Chang (PT-1001)',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  if (cleanUrl.includes('/users')) {
    return getStoredUsers();
  }

  if (cleanUrl.includes('/emergencies')) {
    return [
      {
        id: 1,
        requestCode: 'EMG-2026-0001',
        patientName: 'Emergency Patient',
        phone: '+91 87972 54899',
        emergencyType: 'Ambulance & Trauma',
        priority: 'CRITICAL',
        status: 'DISPATCHED',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  if (cleanUrl.includes('/nurses')) {
    return [
      {
        id: 1,
        nurseCode: 'NUR-3001',
        fullName: 'Clara Oswald',
        email: 'clara.n@vitalsync.com',
        phone: '+1 (555) 333-4455',
        gender: 'Female',
        bloodGroup: 'O+',
        dob: '1994-11-23',
        departmentName: 'Intensive Care Unit (ICU)',
        qualification: 'BSN, RN, Critical Care Specialist',
        experience: '6 Years',
        licenseNumber: 'RN-998822',
        joiningDate: '2021-03-15',
        shift: 'Morning',
        employmentStatus: 'Full-Time',
        status: 'Active',
      },
      {
        id: 2,
        nurseCode: 'NUR-3002',
        fullName: 'Alex Vance',
        email: 'alex.n@vitalsync.com',
        phone: '+1 (555) 666-7788',
        gender: 'Female',
        bloodGroup: 'A+',
        dob: '1992-06-12',
        departmentName: 'Cardiology',
        qualification: 'MSN, Nurse Practitioner',
        experience: '8 Years',
        licenseNumber: 'RN-445511',
        joiningDate: '2020-01-10',
        shift: 'Night',
        employmentStatus: 'Full-Time',
        status: 'Active',
      },
    ];
  }

  return null;
};

// Interceptor to attach JWT token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vitalsync_token');
    if (token && !token.startsWith('offline_demo_token_')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle auth errors globally with resilient fallback
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('vitalsync_token') || '';
    const isMockToken = token.startsWith('offline_demo_token_');
    const method = (error.config?.method || 'get').toLowerCase();

    const isAuthUrl = error.config?.url?.includes('/auth/login') ||
                      error.config?.url?.includes('/auth/register') ||
                      error.config?.url?.includes('/auth/forgot-password') ||
                      error.config?.url?.includes('/auth/reset-password') ||
                      error.config?.url?.includes('/auth/me');

    // If Vite dev server proxy returns 502/504 Bad Gateway/Timeout HTML page because backend is offline
    const isProxyOfflineError = error.response &&
      (error.response.status === 502 || error.response.status === 504 || error.response.status === 503) &&
      (typeof error.response.data === 'string' && error.response.data.includes('Proxy error'));

    if (isProxyOfflineError) {
      error.response = null;
      error.message = 'Network Error';
    }

    // Auth requests must ALWAYS reject on error so components process actual auth state instead of dummy tokens
    if (isAuthUrl && !isMockToken) {
      if (error.response && error.response.status === 401) {
        // Do not redirect on failed login/register form submission
      }
      return Promise.reject(error);
    }

    // If backend returned an explicit response (400, 409, 401, 403, 500), reject so component catches backend message
    if (error.response && !isMockToken) {
      if (error.response.status === 401) {
        if (!isAuthUrl) {
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

    // Only apply fallback when network is completely offline/unreachable or when using mock token
    if (method === 'get') {
      const fallbackData = getFallbackDataForUrl(error.config?.url);
      if (fallbackData !== null) {
        return Promise.resolve({
          data: fallbackData,
          status: 200,
          statusText: 'OK (Resilient Fallback)',
          headers: {},
          config: error.config,
        });
      }
    } else {
      if (isMockToken || !error.response) {
        let reqData = {};
        try {
          reqData = typeof error.config?.data === 'string' ? JSON.parse(error.config.data) : (error.config?.data || {});
        } catch (e) {
          reqData = {};
        }

        const url = error.config?.url || '';
        const cleanUrl = url.split('?')[0];

        // Persistent user database sync
        if (cleanUrl.includes('/users')) {
          let currentUsers = getStoredUsers();
          if (method === 'post' && !cleanUrl.includes('/reset-password')) {
            const newUser = {
              id: Date.now(),
              username: reqData.username || `user_${Date.now()}`,
              fullName: reqData.fullName || 'New Staff Account',
              email: reqData.email || 'user@vitalsync.com',
              phone: reqData.phone || '',
              role: reqData.role || 'DOCTOR',
              status: reqData.status || 'ACTIVE',
              lastLoginAt: new Date().toISOString(),
              ...reqData,
            };
            currentUsers = [newUser, ...currentUsers];
            saveStoredUsers(currentUsers);
            return Promise.resolve({
              data: newUser,
              status: 200,
              statusText: 'OK (Resilient Fallback)',
              headers: {},
              config: error.config,
            });
          }

          if (method === 'put' || method === 'patch' || (method === 'post' && (cleanUrl.includes('/users/') || cleanUrl.includes('/reset-password')))) {
            const urlParts = cleanUrl.split('/users/');
            const targetIdStr = urlParts.length > 1 ? urlParts[1].split('/')[0] : null;

            currentUsers = currentUsers.map((u) => {
              if (targetIdStr && (String(u.id) === String(targetIdStr) || String(u.username) === String(targetIdStr))) {
                return {
                  ...u,
                  fullName: reqData.fullName !== undefined ? reqData.fullName : u.fullName,
                  username: reqData.username !== undefined ? reqData.username : u.username,
                  email: reqData.email !== undefined ? reqData.email : u.email,
                  phone: reqData.phone !== undefined ? reqData.phone : u.phone,
                  role: reqData.role !== undefined ? reqData.role : u.role,
                  status: reqData.status !== undefined ? reqData.status : u.status,
                  ...reqData,
                };
              }
              return u;
            });
            saveStoredUsers(currentUsers);

            const updatedUser = (targetIdStr && currentUsers.find((u) => String(u.id) === String(targetIdStr) || String(u.username) === String(targetIdStr))) || {
              id: Date.now(),
              ...reqData,
            };

            return Promise.resolve({
              data: updatedUser,
              status: 200,
              statusText: 'OK (Resilient Fallback)',
              headers: {},
              config: error.config,
            });
          }
        }

        return Promise.resolve({
          data: {
            id: Date.now(),
            status: 'SUCCESS',
            message: 'Operation recorded successfully.',
            ...reqData,
          },
          status: 200,
          statusText: 'OK (Resilient Fallback)',
          headers: {},
          config: error.config,
        });
      }
    }

    if (error.response?.status === 401 && !isMockToken) {
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
  updateReservationStatus: (id, status, notes, bedId) => api.patch(`/beds/reservations/${id}/status`, { status, notes, bedId }),
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

// 18. Emergency Services Endpoints
export const emergencyApi = {
  getContacts: () => api.get('/emergencies/contacts'),
  create: (data) => api.post('/emergencies', data),
  recordHospitalCall: (id) => api.post(`/emergencies/${id}/call/hospital`),
  recordAmbulanceCall: (id) => api.post(`/emergencies/${id}/call/ambulance`),
  getAll: (params) => api.get('/emergencies', { params }),
  getStats: () => api.get('/emergencies/stats'),
  getMy: () => api.get('/emergencies/my'),
  getById: (id) => api.get(`/emergencies/${id}`),
  updateStatus: (id, data) => api.patch(`/emergencies/${id}/status`, data),
};

// 19. Nurse Management Endpoints
export const nurseApi = {
  getAll: (params) => api.get('/nurses', { params }),
  getById: (id) => api.get(`/nurses/${id}`),
  create: (data) => api.post('/nurses', data),
  update: (id, data) => api.put(`/nurses/${id}`, data),
  updateStatus: (id, status) => api.patch(`/nurses/${id}/status`, { status }),
  delete: (id) => api.delete(`/nurses/${id}`),
};

export default api;

