import React, { useState, useEffect } from 'react';
import { nurseApi, departmentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import PhoneNumberInput from '../../components/common/PhoneNumberInput';

const NurseManagement = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [nurses, setNurses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewNurse, setViewNurse] = useState(null);
  const [editNurse, setEditNurse] = useState(null);

  // Form State
  const [nurseForm, setNurseForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Female',
    bloodGroup: 'O+',
    departmentId: '',
    qualification: 'BSN, RN',
    experience: '3 Years',
    licenseNumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    employmentStatus: 'Full-Time',
    password: 'password123',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [nurseRes, deptRes] = await Promise.allSettled([
        nurseApi.getAll(),
        departmentApi.getAll(),
      ]);

      if (nurseRes.status === 'fulfilled') {
        const fetchedNurses = Array.isArray(nurseRes.value.data)
          ? nurseRes.value.data
          : nurseRes.value.data?.content || [];
        setNurses(fetchedNurses);
      }

      if (deptRes.status === 'fulfilled') {
        const fetchedDepts = Array.isArray(deptRes.value.data) ? deptRes.value.data : [];
        setDepartments(fetchedDepts);
        if (fetchedDepts.length > 0 && !nurseForm.departmentId) {
          setNurseForm((prev) => ({ ...prev, departmentId: fetchedDepts[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching nurse management data:', err);
      toast.error('Failed to load nurse management records.');
    } fontFinally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
  };

  const filteredNurses = nurses.filter((n) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (n.fullName || '').toLowerCase().includes(query) ||
      (n.email || '').toLowerCase().includes(query) ||
      (n.nurseCode || '').toLowerCase().includes(query) ||
      (n.phone || '').toLowerCase().includes(query) ||
      (n.licenseNumber || '').toLowerCase().includes(query);

    const matchesDept =
      departmentFilter === 'ALL' ||
      String(n.departmentId) === String(departmentFilter) ||
      (n.departmentName || '').toLowerCase() === departmentFilter.toLowerCase();

    const matchesShift = shiftFilter === 'ALL' || (n.shift || '').toLowerCase() === shiftFilter.toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || (n.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesShift && matchesStatus;
  });

  const handleCreateNurse = async (e) => {
    e.preventDefault();
    if (!nurseForm.fullName.trim() || !nurseForm.email.trim() || !nurseForm.phone.trim()) {
      toast.error('Please complete all required fields (Name, Email, Phone).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...nurseForm,
        departmentId: nurseForm.departmentId ? Number(nurseForm.departmentId) : null,
      };

      const res = await nurseApi.create(payload);
      toast.success(`Nurse account for ${nurseForm.fullName} registered successfully!`);
      setAddModalOpen(false);

      // Refresh list
      fetchInitialData();

      // Reset Form
      setNurseForm({
        fullName: '',
        email: '',
        phone: '',
        dob: '',
        gender: 'Female',
        bloodGroup: 'O+',
        departmentId: departments[0]?.id || '',
        qualification: 'BSN, RN',
        experience: '3 Years',
        licenseNumber: '',
        joiningDate: new Date().toISOString().split('T')[0],
        shift: 'Morning',
        employmentStatus: 'Full-Time',
        password: 'password123',
      });
    } catch (err) {
      console.error('Create nurse error:', err);
      toast.error(err?.response?.data?.message || 'Failed to create Nurse profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editNurse) return;

    setSubmitting(true);
    try {
      const payload = {
        fullName: editNurse.fullName,
        email: editNurse.email,
        phone: editNurse.phone,
        dob: editNurse.dob,
        gender: editNurse.gender,
        bloodGroup: editNurse.bloodGroup,
        departmentId: editNurse.departmentId ? Number(editNurse.departmentId) : null,
        qualification: editNurse.qualification,
        experience: editNurse.experience,
        licenseNumber: editNurse.licenseNumber,
        joiningDate: editNurse.joiningDate,
        shift: editNurse.shift,
        employmentStatus: editNurse.employmentStatus,
        status: editNurse.status,
      };

      await nurseApi.update(editNurse.id, payload);
      toast.success(`Nurse profile for ${editNurse.fullName} updated successfully!`);
      setEditNurse(null);
      fetchInitialData();
    } catch (err) {
      console.error('Update nurse error:', err);
      toast.error(err?.response?.data?.message || 'Failed to update Nurse profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (nurse) => {
    const nextStatus = nurse.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await nurseApi.updateStatus(nurse.id, nextStatus);
      toast.success(`Nurse status changed to ${nextStatus}`);
      fetchInitialData();
    } catch (err) {
      toast.error('Failed to update nurse status.');
    }
  };

  const handleDeleteNurse = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate nurse ${name}?`)) return;

    try {
      await nurseApi.delete(id);
      toast.success(`Nurse record ${name} removed.`);
      fetchInitialData();
    } catch (err) {
      toast.error('Failed to delete nurse record.');
    }
  };

  // Aggregates
  const totalNurses = nurses.length;
  const activeNurses = nurses.filter((n) => (n.status || '').toLowerCase() === 'active').length;
  const morningShift = nurses.filter((n) => (n.shift || '').toLowerCase().includes('morning') || (n.shift || '').toLowerCase().includes('day')).length;
  const nightShift = nurses.filter((n) => (n.shift || '').toLowerCase().includes('night')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">medical_services</span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Nurse Staff Management</h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Centralized nursing department clinical rosters, shift assignments, and credentials database.
          </p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Register New Nurse</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Total Nurses</span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center material-symbols-outlined text-lg">
              groups
            </span>
          </div>
          <p className="font-headline-md text-2xl font-bold text-on-surface mt-2">{totalNurses}</p>
          <p className="text-[11px] text-outline mt-0.5">Persisted DB Roster</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Active Duty</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center material-symbols-outlined text-lg">
              verified
            </span>
          </div>
          <p className="font-headline-md text-2xl font-bold text-emerald-600 mt-2">{activeNurses}</p>
          <p className="text-[11px] text-outline mt-0.5">Available Clinical Staff</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Morning / Day Shift</span>
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center material-symbols-outlined text-lg">
              wb_sunny
            </span>
          </div>
          <p className="font-headline-md text-2xl font-bold text-on-surface mt-2">{morningShift}</p>
          <p className="text-[11px] text-outline mt-0.5">08:00 AM - 04:00 PM</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Night Shift</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center material-symbols-outlined text-lg">
              bedtime
            </span>
          </div>
          <p className="font-headline-md text-2xl font-bold text-on-surface mt-2">{nightShift}</p>
          <p className="text-[11px] text-outline mt-0.5">08:00 PM - 08:00 AM</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nurses by name, email, license, or code..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Shifts</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
            <option value="Night">Night</option>
            <option value="Rotational">Rotational</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Nurses Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader message="Loading nurse records from Railway MySQL..." />
          </div>
        ) : filteredNurses.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="medical_services"
              title="No Nurses Found"
              description="No registered nurses match your query or filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                <tr>
                  <th className="py-3.5 px-6">Nurse Code & Name</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Qualification & License</th>
                  <th className="py-3.5 px-6">Shift & Contact</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {filteredNurses.map((n) => (
                  <tr key={n.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 font-bold flex items-center justify-center text-xs">
                          {(n.fullName || 'N').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{n.fullName}</p>
                          <span className="font-mono text-[11px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                            {n.nurseCode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-on-surface">{n.departmentName || 'General Care'}</p>
                      <p className="text-on-surface-variant text-[11px]">{n.employmentStatus || 'Full-Time'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-on-surface font-medium">{n.qualification || 'RN'}</p>
                      <p className="text-on-surface-variant text-[11px] font-mono">
                        Lic: {n.licenseNumber || 'N/A'} • Exp: {n.experience || 'N/A'}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-on-surface font-medium">
                        <span className="material-symbols-outlined text-sm text-outline">schedule</span>
                        <span>{n.shift || 'Morning'}</span>
                      </div>
                      <p className="text-on-surface-variant text-[11px]">{n.email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                          (n.status || '').toLowerCase() === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {n.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setViewNurse(n)}
                        className="inline-flex items-center gap-1 bg-surface border border-outline-variant hover:border-primary/40 text-on-surface text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        <span>View</span>
                      </button>

                      {currentUser?.role === 'ADMIN' && (
                        <>
                          <button
                            onClick={() => setEditNurse({ ...n })}
                            className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Edit Nurse Profile"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleStatusToggle(n)}
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                              (n.status || '').toLowerCase() === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                            title={n.status === 'Active' ? 'Deactivate Nurse' : 'Activate Nurse'}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {n.status === 'Active' ? 'person_off' : 'check_circle'}
                            </span>
                            <span>{n.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteNurse(n.id, n.fullName)}
                            className="inline-flex items-center gap-1 text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete Nurse"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Nurse Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">medical_services</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Register New Nurse Profile</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-outline hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateNurse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={nurseForm.fullName}
                    onChange={(e) => setNurseForm({ ...nurseForm, fullName: e.target.value })}
                    placeholder="e.g. Clara Oswald"
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
                    value={nurseForm.email}
                    onChange={(e) => setNurseForm({ ...nurseForm, email: e.target.value })}
                    placeholder="nurse@vitalsync.com"
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <PhoneNumberInput
                    label="Phone Number"
                    required
                    value={nurseForm.phone}
                    onChange={(val) => setNurseForm({ ...nurseForm, phone: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Login Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={nurseForm.password}
                    onChange={(e) => setNurseForm({ ...nurseForm, password: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Department
                  </label>
                  <select
                    value={nurseForm.departmentId}
                    onChange={(e) => setNurseForm({ ...nurseForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Shift *
                  </label>
                  <select
                    value={nurseForm.shift}
                    onChange={(e) => setNurseForm({ ...nurseForm, shift: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Morning">Morning Shift</option>
                    <option value="Evening">Evening Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Rotational">Rotational Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Gender
                  </label>
                  <select
                    value={nurseForm.gender}
                    onChange={(e) => setNurseForm({ ...nurseForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={nurseForm.qualification}
                    onChange={(e) => setNurseForm({ ...nurseForm, qualification: e.target.value })}
                    placeholder="e.g. BSN, RN"
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={nurseForm.experience}
                    onChange={(e) => setNurseForm({ ...nurseForm, experience: e.target.value })}
                    placeholder="e.g. 5 Years"
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={nurseForm.licenseNumber}
                    onChange={(e) => setNurseForm({ ...nurseForm, licenseNumber: e.target.value })}
                    placeholder="e.g. RN-884499"
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-surface-variant flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Save & Persist Nurse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Nurse Modal */}
      {editNurse && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">edit</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Edit Nurse Profile: {editNurse.nurseCode}
                </h3>
              </div>
              <button onClick={() => setEditNurse(null)} className="text-outline hover:text-on-surface cursor-pointer">
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
                    value={editNurse.fullName || ''}
                    onChange={(e) => setEditNurse({ ...editNurse, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editNurse.email || ''}
                    onChange={(e) => setEditNurse({ ...editNurse, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <PhoneNumberInput
                    label="Phone Number"
                    required
                    value={editNurse.phone || ''}
                    onChange={(val) => setEditNurse({ ...editNurse, phone: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Department
                  </label>
                  <select
                    value={editNurse.departmentId || ''}
                    onChange={(e) => setEditNurse({ ...editNurse, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Shift *
                  </label>
                  <select
                    value={editNurse.shift || 'Morning'}
                    onChange={(e) => setEditNurse({ ...editNurse, shift: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Rotational">Rotational</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={editNurse.qualification || ''}
                    onChange={(e) => setEditNurse({ ...editNurse, qualification: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={editNurse.licenseNumber || ''}
                    onChange={(e) => setEditNurse({ ...editNurse, licenseNumber: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Status
                  </label>
                  <select
                    value={editNurse.status || 'Active'}
                    onChange={(e) => setEditNurse({ ...editNurse, status: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-variant flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditNurse(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Update Nurse Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Nurse Detail Modal */}
      {viewNurse && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 font-bold flex items-center justify-center text-sm">
                  {(viewNurse.fullName || 'N').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">{viewNurse.fullName}</h3>
                  <p className="text-xs text-primary font-mono">{viewNurse.nurseCode}</p>
                </div>
              </div>
              <button onClick={() => setViewNurse(null)} className="text-outline hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-surface p-4 rounded-xl border border-outline-variant/60">
              <div>
                <p className="text-[10px] text-outline uppercase font-semibold">Department</p>
                <p className="font-bold text-on-surface">{viewNurse.departmentName || 'General Care'}</p>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase font-semibold">Shift</p>
                <p className="font-bold text-on-surface">{viewNurse.shift || 'Morning'}</p>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase font-semibold">Email</p>
                <p className="font-medium text-on-surface truncate">{viewNurse.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase font-semibold">Phone</p>
                <p className="font-medium text-on-surface">{viewNurse.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase font-semibold">Qualification</p>
                <p className="font-medium text-on-surface">{viewNurse.qualification || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase font-semibold">License Number</p>
                <p className="font-mono text-on-surface">{viewNurse.licenseNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase font-semibold">Status</p>
                <span className="font-bold text-emerald-600">{viewNurse.status || 'Active'}</span>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase font-semibold">Joining Date</p>
                <p className="font-medium text-on-surface">{viewNurse.joiningDate || 'N/A'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewNurse(null)}
                className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:bg-primary-container cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseManagement;
