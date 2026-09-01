import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VitalSyncLogo from '../common/VitalSyncLogo';

const PublicNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getPortalLink = () => {
    if (!user) return '/login';
    if (user.role === 'PATIENT') return '/patient/dashboard';
    if (user.role === 'DOCTOR') return '/doctor/dashboard';
    return '/dashboard';
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Doctors', path: '/public-doctors' },
    { label: 'Departments', path: '/public-departments' },
    { label: 'Services', path: '/services' },
    { label: 'Bed & ICU Availability', path: '/public-beds' },
    { label: 'Emergency 24/7', path: '/emergency', highlight: true },
  ];

  return (
    <header className="bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/60 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <VitalSyncLogo showText={true} className="w-10 h-10 group-hover:scale-105 transition-transform" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    link.highlight
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 shadow-xs'
                      : isActive
                      ? 'text-primary bg-primary/10 font-bold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={getPortalLink()}
                  className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">dashboard</span>
                  <span>Enter My Portal</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="text-xs font-semibold text-outline-variant hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login?tab=register"
                  className="text-xs font-bold text-primary hover:text-primary-container px-3.5 py-2 rounded-xl hover:bg-primary/5 transition-all"
                >
                  Patient Register
                </Link>
                <Link
                  to="/login"
                  className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">lock</span>
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
              aria-label="Toggle navigation"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-lowest border-b border-outline-variant p-4 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                link.highlight
                  ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-outline-variant/60 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to={getPortalLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-primary text-on-primary text-sm font-bold py-2.5 rounded-xl"
              >
                Go to Portal
              </Link>
            ) : (
              <>
                <Link
                  to="/login?tab=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-primary/10 text-primary text-sm font-bold py-2 rounded-xl"
                >
                  Patient Register
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-primary text-on-primary text-sm font-bold py-2.5 rounded-xl shadow-xs"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
