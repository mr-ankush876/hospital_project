import React, { useState, useEffect } from 'react';
import { userManagementApi, departmentApi, settingApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import PhoneNumberInput from '../../components/common/PhoneNumberInput';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Never';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Never';
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Create Staff Modal State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: 'password123',
    role: 'DOCTOR',
    departmentId: '',
    specialization: 'General Medicine',
    qualification: 'MD / MBBS',
    experience: '5 Years',
    availableDays: 'Mon - Fri',
    availableTime: '09:00 AM - 05:00 PM',
    consultationFee: '100.00',
  });
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Edit User Modal State
  const [editModalUser, setEditModalUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'DOCTOR',
    status: 'ACTIVE',
    password: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const toast = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [uRes, depRes] = await Promise.allSettled([
        userManagementApi.getAllUsers({ role: roleFilter, status: statusFilter, search }),
        departmentApi.getAll(),
      ]);

      if (uRes.status === 'fulfilled') setUsers(uRes.value.data || []);
      if (depRes.status === 'fulfilled') {
        const deps = depRes.value.data || [];
        setDepartments(deps);
        if (deps.length > 0 && !staffForm.departmentId) {
          setStaffForm((prev) => ({ ...prev, departmentId: deps[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [roleFilter, statusFilter, search]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchUsers();
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await userManagementApi.updateUserStatus(id, nextStatus);
      toast.success(`Account status changed to ${nextStatus}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update account status.');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreatingStaff(true);
    try {
      await userManagementApi.createStaffAccount(staffForm);
      toast.success(`Staff account for ${staffForm.fullName} created successfully.`);
      setStaffModalOpen(false);
      setStaffForm({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: 'password123',
        role: 'DOCTOR',
        departmentId: departments[0]?.id || '',
        specialization: 'General Medicine',
        qualification: 'MD / MBBS',
        experience: '5 Years',
        availableDays: 'Mon - Fri',
        availableTime: '09:00 AM - 05:00 PM',
        consultationFee: '100.00',
      });
      fetchUsers();
    } catch (err) {
      console.error('Create staff error:', err);
      toast.error(err?.response?.data?.message || 'Failed to create staff account.');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setResetting(true);
    try {
      await userManagementApi.resetUserPassword(resetModalUser.id, newPassword);
      toast.success(`Password reset for ${resetModalUser.username}`);
      setResetModalUser(null);
      setNewPassword('');
    } catch (err) {
      toast.error('Failed to reset password.');
    } finally {
      setResetting(false);
    }
  };

  const openEditModal = (u) => {
    setEditModalUser(u);
    setEditForm({
      fullName: u.fullName || '',
      username: u.username || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'PATIENT',
      status: u.status || 'ACTIVE',
      password: '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.username.trim() || !editForm.fullName.trim() || !editForm.email.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      toast.error('Password must be at least 6 characters if provided.');
      return;
    }

    setSavingEdit(true);
    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        status: editForm.status,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      // 1. Try central admin update endpoint
      try {
        await userManagementApi.updateUser(editModalUser.id, payload);
      } catch (err) {
        // 2. Fallback to individual supported endpoints on cloud backend:
        try {
          await settingApi.updateUserProfile({
            fullName: editForm.fullName.trim(),
            email: editForm.email.trim(),
          });
        } catch (e) {
          // ignore if not same user
        }

        if (editForm.password?.trim()) {
          try {
            await userManagementApi.resetUserPassword(editModalUser.id, editForm.password.trim());
          } catch (e) {
            console.error(e);
          }
        }

        if (editForm.status && editForm.status !== editModalUser.status) {
          try {
            await userManagementApi.updateUserStatus(editModalUser.id, editForm.status);
          } catch (e) {
            console.error(e);
          }
        }
      }

      // 3. Immediately update in-memory React state so UI updates in real-time
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === editModalUser.id
            ? {
                ...u,
                fullName: editForm.fullName.trim(),
                username: editForm.username.trim(),
                email: editForm.email.trim(),
                phone: editForm.phone.trim(),
                role: editForm.role,
                status: editForm.status,
              }
            : u
        )
      );

      // 4. Update stored session user if current user is edited
      try {
        const storedStr = localStorage.getItem('vitalsync_user');
        if (storedStr) {
          const stored = JSON.parse(storedStr);
          if (stored.id === editModalUser.id || stored.username === editModalUser.username) {
            const updatedUser = {
              ...stored,
              fullName: editForm.fullName.trim(),
              username: editForm.username.trim(),
              email: editForm.email.trim(),
              phone: editForm.phone.trim(),
              role: editForm.role,
              status: editForm.status,
            };
            localStorage.setItem('vitalsync_user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {
        console.error(e);
      }

      toast.success(`Account @${editForm.username} updated successfully!`);
      setEditModalUser(null);
      setTimeout(() => fetchUsers(), 500);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update account.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Central User & Account Management</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Single centralized database of all hospital accounts (Patients, Doctors, Receptionists, and Admins).
          </p>
        </div>

        <button
          onClick={() => setStaffModalOpen(true)}
          className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>Create Staff Account</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts by username, name, or email..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="DOCTOR">DOCTOR</option>
            <option value="RECEPTIONIST">RECEPTIONIST</option>
            <option value="PATIENT">PATIENT</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader message="Loading central user accounts..." />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="manage_accounts"
              title="No Accounts Found"
              description="No user accounts match your search filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                <tr>
                  <th className="py-3.5 px-6">User Account</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Email & Phone</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Last Login</th>
                  <th className="py-3.5 px-6 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          {(u.fullName || u.username).substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{u.fullName || u.username}</p>
                          <p className="font-mono text-[11px] text-on-surface-variant">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={u.role} size="xs" />
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-on-surface">{u.email}</p>
                      <p className="text-on-surface-variant text-[11px]">{u.phone || 'No phone'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant font-mono text-[11px] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm text-outline">schedule</span>
                        {formatDateTime(u.lastLoginAt)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Edit User Account"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setResetModalUser(u)}
                        className="inline-flex items-center gap-1 bg-surface border border-outline-variant hover:border-primary/40 text-on-surface text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Reset Password"
                      >
                        <span className="material-symbols-outlined text-sm">key</span>
                        <span>Password</span>
                      </button>

                      <button
                        onClick={() => handleStatusToggle(u.id, u.status)}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          u.status === 'ACTIVE'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {u.status === 'ACTIVE' ? 'person_off' : 'check_circle'}
                        </span>
                        <span>{u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">person_add</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Provision Staff Account</h3>
              </div>
              <button onClick={() => setStaffModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Staff Role *
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    placeholder="e.g. dr.watson"
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. John Watson"
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="watson@vitalsync.com"
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <PhoneNumberInput
                    label="Phone Number"
                    required
                    value={staffForm.phone}
                    onChange={(val) => setStaffForm({ ...staffForm, phone: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              {staffForm.role === 'DOCTOR' && (
                <div className="p-3.5 bg-surface rounded-xl border border-outline-variant/50 space-y-3">
                  <p className="text-xs font-bold text-primary">Doctor Profile Specifications</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Department
                      </label>
                      <select
                        value={staffForm.departmentId}
                        onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-semibold text-on-surface"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={staffForm.specialization}
                        onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-surface-variant flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container disabled:opacity-50"
                >
                  {creatingStaff ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-2">
              <h3 className="font-bold text-sm text-on-surface">
                Reset Password: @{resetModalUser.username}
              </h3>
              <button onClick={() => setResetModalUser(null)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:bg-primary-container cursor-pointer"
                >
                  {resetting ? 'Resetting...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Account Modal */}
      {editModalUser && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">edit</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Edit Account: @{editModalUser.username}
                </h3>
              </div>
              <button onClick={() => setEditModalUser(null)} className="text-outline hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <PhoneNumberInput
                    label="Phone Number"
                    value={editForm.phone}
                    onChange={(val) => setEditForm({ ...editForm, phone: val })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Account Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="PATIENT">PATIENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Change Password (Optional — leave blank to keep existing password)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-surface-variant flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-primary-container disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {savingEdit ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
