import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

// Layout
import Layout from './components/layout/Layout';

// Public Pages
import PublicHome from './pages/public/PublicHome';
import PublicDoctors from './pages/public/PublicDoctors';
import PublicDepartments from './pages/public/PublicDepartments';
import PublicBeds from './pages/public/PublicBeds';
import PublicServices from './pages/public/PublicServices';
import PublicEmergency from './pages/public/PublicEmergency';
import Login from './pages/Login';

// Patient Portal Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientBookAppointment from './pages/patient/PatientBookAppointment';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import PatientReports from './pages/patient/PatientReports';
import PatientBedReservations from './pages/patient/PatientBedReservations';
import PatientBilling from './pages/patient/PatientBilling';
import PatientProfile from './pages/patient/PatientProfile';
import PatientEmergency from './pages/patient/PatientEmergency';
import EmergencyManagement from './pages/admin/EmergencyManagement';

// Doctor Portal Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorProfile from './pages/doctor/DoctorProfile';

// Staff & Admin Pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Prescriptions from './pages/Prescriptions';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UserManagement from './pages/admin/UserManagement';
import Departments from './pages/admin/Departments';
import BedManagement from './pages/admin/BedManagement';
import AuditLogs from './pages/admin/AuditLogs';
import MedicalReportsAdmin from './pages/admin/MedicalReportsAdmin';
import AdminLogin from './pages/admin/AdminLogin';

// Route guard component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.includes(user?.role) || user?.role === 'ADMIN';
    if (!hasPermission) {
      if (user?.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
      if (user?.role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// Root route resolver
const RootRoute = () => {
  return <PublicHome />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* 1. Public Hospital Pages */}
            <Route path="/" element={<RootRoute />} />
            <Route path="/public-doctors" element={<PublicDoctors />} />
            <Route path="/public-departments" element={<PublicDepartments />} />
            <Route path="/public-beds" element={<PublicBeds />} />
            <Route path="/services" element={<PublicServices />} />
            <Route path="/emergency" element={<PublicEmergency />} />
            <Route path="/public-emergency" element={<PublicEmergency />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* 2. Patient Self-Service Portal */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <Layout><PatientDashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/book-appointment"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <Layout><PatientBookAppointment /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <Layout><PatientAppointments /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <Layout><PatientPrescriptions /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/reports"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <Layout><PatientReports /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/beds"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <Layout><PatientBedReservations /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/bills"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <Layout><PatientBilling /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/billing"
              element={<Navigate to="/patient/bills" replace />}
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <Layout><PatientProfile /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/emergency"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <Layout><PatientEmergency /></Layout>
                </ProtectedRoute>
              }
            />

            {/* 3. Doctor Portal */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <Layout><DoctorDashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <Layout><DoctorAppointments /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <Layout><DoctorPatients /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/profile"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <Layout><DoctorProfile /></Layout>
                </ProtectedRoute>
              }
            />

            {/* 4. Staff & Admin Portal */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                  <Layout><Patients /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Layout><Doctors /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                  <Layout><Appointments /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                  <Layout><Prescriptions /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                  <Layout><Billing /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                  <Layout><MedicalReportsAdmin /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Layout><Reports /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout><Settings /></Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin Management Pages */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Layout><UserManagement /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Layout><Departments /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/beds"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                  <Layout><BedManagement /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Layout><AuditLogs /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/emergencies"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                  <Layout><EmergencyManagement /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergencies"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                  <Layout><EmergencyManagement /></Layout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
