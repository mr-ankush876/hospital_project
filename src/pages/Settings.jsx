import React, { useState, useEffect } from 'react';
import { settingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import VitalSyncLogo from '../components/common/VitalSyncLogo';

const Settings = () => {
  const { user, hasRole, updateUserProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(hasRole(['ADMIN']) ? 'hospital' : 'profile');
  const [loading, setLoading] = useState(false);

  // Hospital Profile Form State
  const [hospitalForm, setHospitalForm] = useState({
    hospitalName: 'VitalSync Multi-Specialty Hospital',
    phone: '+91 (800) 123-4567',
    email: 'info@vitalsync.com',
    address: 'Medical Center Road, Healthcare City, MH 400001',
    registrationNumber: 'VS-HOSP-2026-IND',
    invoiceFooter: 'Thank you for trusting VitalSync Healthcare. Get well soon!',
  });

  // User Profile Form State
  const [userForm, setUserForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
    role: user?.role || '',
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  useEffect(() => {
    if (user) {
      setUserForm({
        fullName: user.fullName || '',
        email: user.email || '',
        username: user.username || '',
        role: user.role || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchHospitalProfile = async () => {
      try {
        const res = await settingApi.getHospitalProfile();
        if (res.data) {
          setHospitalForm(res.data);
        }
      } catch (err) {
        // Fallback default state is already initialized
      }
    };
    if (hasRole(['ADMIN'])) {
      fetchHospitalProfile();
    }
  }, [hasRole]);

  const handleHospitalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingApi.updateHospitalProfile(hospitalForm);
      toast.success('Hospital settings updated successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update hospital profile.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingApi.updateUserProfile({
        fullName: userForm.fullName,
        email: userForm.email,
      });
      updateUserProfile({
        fullName: userForm.fullName,
        email: userForm.email,
      });
      toast.success('Your profile details have been updated.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update user profile.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.warning('Please enter your current password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      await settingApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password. Verify your current password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">System Settings</h1>
        <p className="font-body-md text-on-surface-variant text-sm mt-1">
          Manage clinical institution profile, personal credentials, and system configuration.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-variant">
        {hasRole(['ADMIN']) && (
          <button
            onClick={() => setActiveTab('hospital')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'hospital'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg">local_hospital</span>
            <span>Hospital Profile</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">account_circle</span>
          <span>User Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">lock</span>
          <span>Security & Password</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm max-w-3xl">
        {/* 1. Hospital Profile Tab */}
        {activeTab === 'hospital' && hasRole(['ADMIN']) && (
          <form onSubmit={handleHospitalSubmit} className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-surface-variant">
              <VitalSyncLogo className="w-12 h-12" />
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Institutional Profile</h3>
                <p className="text-xs text-on-surface-variant">Details displayed on printable prescriptions and invoices.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  value={hospitalForm.hospitalName}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, hospitalName: e.target.value })}
                  required
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Hospital Phone
                </label>
                <input
                  type="tel"
                  value={hospitalForm.phone}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Hospital Email
                </label>
                <input
                  type="email"
                  value={hospitalForm.email}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Facility Physical Address
                </label>
                <input
                  type="text"
                  value={hospitalForm.address}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Government License / Reg. No.
                </label>
                <input
                  type="text"
                  value={hospitalForm.registrationNumber}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, registrationNumber: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Invoice & Prescription Disclaimer Footer
                </label>
                <textarea
                  rows={2}
                  value={hospitalForm.invoiceFooter}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, invoiceFooter: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-surface-variant flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>Save Hospital Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. User Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUserSubmit} className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-surface-variant">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-white font-bold flex items-center justify-center text-lg shadow-sm">
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'VS'}
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">{userForm.fullName || user?.username}</h3>
                <div className="mt-1">
                  <StatusBadge status={userForm.role} size="xs" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  required
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  System Username
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  disabled
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-outline cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Assigned Security Role
                </label>
                <input
                  type="text"
                  value={userForm.role}
                  disabled
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-outline cursor-not-allowed uppercase font-bold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-surface-variant flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>Update Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. Security & Password Tab */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="pb-4 border-b border-surface-variant">
              <h3 className="font-headline-md text-headline-md text-on-surface">Update Password</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Ensure your account is using a strong password with at least 6 characters.
              </p>
            </div>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    className="w-full bg-surface border border-outline-variant rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showCurrentPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    className="w-full bg-surface border border-outline-variant rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showNewPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Confirm New Password *
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-surface-variant flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>Change Password</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Settings;
