import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VitalSyncLogo from '../common/VitalSyncLogo';
import StatusBadge from '../common/StatusBadge';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];

    if (user.role === 'PATIENT') {
      return [
        { label: 'Emergency 24/7', icon: 'emergency', path: '/patient/emergency', highlight: true },
        { label: 'Book Appointment', icon: 'add_circle', path: '/patient/book-appointment' },
        { label: 'My Appointments', icon: 'event_available', path: '/patient/appointments' },
        { label: 'My Prescriptions', icon: 'prescriptions', path: '/patient/prescriptions' },
        { label: 'Medical Reports', icon: 'description', path: '/patient/reports' },
        { label: 'Bed & ICU Request', icon: 'hotel', path: '/patient/beds' },
        { label: 'My Invoices & Bills', icon: 'receipt_long', path: '/patient/bills' },
        { label: 'Personal Profile', icon: 'account_circle', path: '/patient/profile' },
      ];
    }

    if (user.role === 'DOCTOR') {
      return [
        { label: 'Doctor Dashboard', icon: 'dashboard', path: '/doctor/dashboard' },
        { label: 'Emergency Desk', icon: 'emergency', path: '/admin/emergencies', highlight: true },
        { label: 'My Consultations', icon: 'event_available', path: '/doctor/appointments' },
        { label: 'Clinical Patients', icon: 'group', path: '/doctor/patients' },
        { label: 'Prescriptions', icon: 'prescriptions', path: '/prescriptions' },
        { label: 'Medical Reports', icon: 'description', path: '/medical-reports' },
        { label: 'Doctor Profile', icon: 'account_circle', path: '/doctor/profile' },
      ];
    }

    if (user.role === 'RECEPTIONIST') {
      return [
        { label: 'Reception Dashboard', icon: 'dashboard', path: '/dashboard' },
        { label: 'Emergency Desk', icon: 'emergency', path: '/admin/emergencies', highlight: true },
        { label: 'Receptionist Desk', icon: 'desk', path: '/admin/receptionist-desk' },
        { label: 'Patients Desk', icon: 'group', path: '/patients' },
        { label: 'Appointments', icon: 'event_available', path: '/appointments' },
        { label: 'Beds & ICU Allocation', icon: 'hotel', path: '/admin/beds' },
        { label: 'Billing Desk', icon: 'payments', path: '/billing' },
      ];
    }

    // Default: ADMIN
    return [
      { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { label: 'Emergency Desk', icon: 'emergency', path: '/admin/emergencies', highlight: true },
      { label: 'Receptionist Desk', icon: 'desk', path: '/admin/receptionist-desk' },
      { label: 'User & Accounts', icon: 'manage_accounts', path: '/admin/users' },
      { label: 'Patients', icon: 'group', path: '/patients' },
      { label: 'Doctors', icon: 'medical_services', path: '/doctors' },
      { label: 'Appointments', icon: 'event_available', path: '/appointments' },
      { label: 'Departments', icon: 'domain', path: '/admin/departments' },
      { label: 'Beds & ICU', icon: 'hotel', path: '/admin/beds' },
      { label: 'Prescriptions', icon: 'prescriptions', path: '/prescriptions' },
      { label: 'Billing', icon: 'payments', path: '/billing' },
      { label: 'Medical Reports', icon: 'description', path: '/medical-reports' },
      { label: 'Analytics Reports', icon: 'assessment', path: '/reports' },
      { label: 'Audit Logs', icon: 'history', path: '/admin/audit-logs' },
      { label: 'Hospital Settings', icon: 'settings', path: '/settings' },
    ];
  };

  const visibleItems = getNavItems();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[260px] bg-inverse-surface text-on-primary-fixed border-r border-outline-variant shadow-lg z-50 flex flex-col py-6 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-6 mb-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <VitalSyncLogo showText={true} className="w-9 h-9" />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-outline hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="px-4 mb-4">
            <div className="bg-surface-container-highest/10 border border-outline/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-on-primary font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'VS'}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="font-semibold text-xs text-white truncate">{user.fullName || user.username}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <StatusBadge status={user.role} size="xs" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? item.highlight
                      ? 'bg-rose-600 text-white shadow-sm font-bold'
                      : 'bg-primary text-white shadow-sm border-l-4 border-primary-fixed-dim'
                    : item.highlight
                    ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                    : 'text-outline-variant hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`material-symbols-outlined text-[20px] ${item.highlight ? 'text-rose-400' : ''}`}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.highlight && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-rose-600 text-white shrink-0">
                  24/7
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="px-3 mt-auto pt-3 border-t border-outline/20 space-y-1">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-outline-variant hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors duration-200 text-xs font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">public</span>
            <span>Hospital Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-outline-variant hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-200 text-xs font-medium text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
