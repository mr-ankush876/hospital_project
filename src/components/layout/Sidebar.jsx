import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VitalSyncLogo from '../common/VitalSyncLogo';
import StatusBadge from '../common/StatusBadge';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { label: 'Patients', icon: 'group', path: '/patients', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { label: 'Doctors', icon: 'medical_services', path: '/doctors', roles: ['ADMIN'] },
    { label: 'Appointments', icon: 'event_available', path: '/appointments', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { label: 'Prescriptions', icon: 'prescriptions', path: '/prescriptions', roles: ['ADMIN', 'DOCTOR'] },
    { label: 'Billing', icon: 'payments', path: '/billing', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'Reports', icon: 'assessment', path: '/reports', roles: ['ADMIN'] },
    { label: 'Settings', icon: 'settings', path: '/settings', roles: ['ADMIN'] },
  ];

  const visibleItems = navItems.filter((item) => hasRole(item.roles));

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
        <div className="px-6 mb-6 flex items-center justify-between">
          <VitalSyncLogo showText={true} className="w-9 h-9" />
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
          <div className="px-4 mb-5">
            <div className="bg-surface-container-highest/10 border border-outline/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'VS'}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="font-semibold text-xs text-white truncate">{user.fullName || user.username}</p>
                <div className="mt-0.5">
                  <StatusBadge status={user.role} size="xs" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1.5 scrollbar-thin">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-primary text-white shadow-sm border-l-4 border-primary-fixed-dim'
                    : 'text-outline-variant hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="px-3 mt-auto pt-4 border-t border-outline/20 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-outline-variant hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-200 text-sm font-medium text-left"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
