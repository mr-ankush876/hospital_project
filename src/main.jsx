import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Prescriptions from './pages/Prescriptions';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Forbidden from './pages/Forbidden';
import NotFound from './pages/NotFound';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Patients: All Roles */}
                <Route path="/patients" element={<Patients />} />

                {/* Doctors: Admin Only */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/doctors" element={<Doctors />} />
                </Route>

                {/* Appointments: All Roles */}
                <Route path="/appointments" element={<Appointments />} />

                {/* Prescriptions: Doctor & Admin Only */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']} />}>
                  <Route path="/prescriptions" element={<Prescriptions />} />
                </Route>

                {/* Billing: Admin & Receptionist Only */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']} />}>
                  <Route path="/billing" element={<Billing />} />
                </Route>

                {/* Reports: Admin Only */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/reports" element={<Reports />} />
                </Route>

                {/* Settings: All Roles */}
                <Route path="/settings" element={<Settings />} />

                {/* 403 Forbidden */}
                <Route path="/forbidden" element={<Forbidden />} />
              </Route>
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
