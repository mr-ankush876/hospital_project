import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';
import VitalSyncLogo from '../../components/common/VitalSyncLogo';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetTokenInfo, setResetTokenInfo] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both your administrator username and password.');
      return;
    }

    const result = await login(username.trim(), password);
    if (result.success) {
      if (result.role === 'ADMIN') {
        toast.success(`Welcome to Administrative Console, ${result.user?.fullName || username}!`);
        navigate('/dashboard');
      } else if (result.role === 'DOCTOR') {
        toast.info('Redirecting to Clinical Doctor Portal...');
        navigate('/doctor/dashboard');
      } else if (result.role === 'RECEPTIONIST') {
        toast.info('Redirecting to Reception Desk...');
        navigate('/dashboard');
      } else {
        toast.error('Access Restricted: Administrator privileges required.');
        navigate('/patient/dashboard');
      }
    } else {
      toast.error(result.error || 'Administrator authentication failed. Please verify credentials.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your registered administrative email.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: forgotEmail.trim() });
      toast.success(res.data?.message || 'Password reset token generated.');
      setResetTokenInfo(res.data?.resetToken);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to locate administrative account with that email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must contain at least 6 characters.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await authApi.resetPassword({ token: resetTokenInfo, newPassword });
      toast.success(res.data?.message || 'Password updated successfully! Please log in.');
      setForgotOpen(false);
      setResetTokenInfo(null);
      setForgotEmail('');
      setNewPassword('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-between p-4 sm:p-6 selection:bg-primary/20">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back to Hospital Website</span>
        </Link>
        <div className="text-[11px] sm:text-xs text-on-surface-variant flex items-center gap-1.5 bg-surface px-3 py-1 rounded-full border border-outline-variant/50 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Private Hospital Administration Gateway</span>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto space-y-6 my-auto py-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex justify-center mb-3">
            <VitalSyncLogo className="w-14 h-14" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">Executive Admin Portal</h1>
          <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
            VitalSync HMS • Clinical & Administrative Governance Console
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-surface border border-outline-variant/80 rounded-3xl shadow-md p-6 sm:p-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary/10 text-primary mb-2">
              <span className="material-symbols-outlined text-sm">shield</span>
              <span>Authorized Personnel Only</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Admin Sign In</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Enter authorized administrator credentials to manage hospital operations, staff accounts, and clinical databases.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Administrator Username / Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                  admin_panel_settings
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                  lock
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors p-1 cursor-pointer"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Authenticate & Enter Console &rarr;</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">lock_reset</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Admin Recovery</h3>
              </div>
              <button
                onClick={() => {
                  setForgotOpen(false);
                  setResetTokenInfo(null);
                }}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {!resetTokenInfo ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-on-surface-variant">
                  Enter the administrative email registered with your hospital account. A secure recovery token will be verified.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Registered Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. admin@vitalsync.com"
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:bg-primary-container text-xs cursor-pointer"
                >
                  {forgotLoading ? 'Verifying...' : 'Generate Recovery Token'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <p className="font-bold">Admin token verified successfully!</p>
                  <p className="font-mono text-[11px] break-all mt-1">Token: {resetTokenInfo}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Enter New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 text-xs cursor-pointer"
                >
                  {resetLoading ? 'Saving...' : 'Set New Password & Complete'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center text-xs text-on-surface-variant pb-2">
        <p>© {new Date().getFullYear()} VitalSync HMS • Clinical Precision Hospital Management System</p>
      </div>
    </div>
  );
};

export default AdminLogin;
