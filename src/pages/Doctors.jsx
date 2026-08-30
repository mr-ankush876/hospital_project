import React, { useState, useEffect } from 'react';
import { doctorApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { CardSkeleton } from '../components/common/Loader';
import Pagination from '../components/common/Pagination';

const Doctors = () => {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals & States
  const [showModal, setShowModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    availableDays: 'Mon, Wed, Fri',
    availableTime: '09:00 AM - 05:00 PM',
    status: 'Available',
    imageUrl: '',
  });

  const specializations = [
    'Cardiology',
    'Pediatrics',
    'Neurology',
    'General Practice',
    'Orthopedics',
    'Dermatology',
    'Ophthalmology',
    'ENT',
    'Gynecology',
    'Oncology',
  ];

  const doctorStatuses = ['Available', 'In Surgery', 'On Leave', 'Unavailable'];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await doctorApi.getAll();
      setDoctors(Array.isArray(res.data) ? res.data : res.data?.content || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setError('Unable to load clinical doctor staff.');
      toast.error('Failed to load doctor directory.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase();
    const nameMatch = (d.fullName || '').toLowerCase().includes(q);
    const codeMatch = (d.doctorCode || '').toLowerCase().includes(q);
    const specMatch = (d.specialization || '').toLowerCase().includes(q);

    const matchesSearch = !search || nameMatch || codeMatch || specMatch;
    const matchesSpec = !specFilter || d.specialization === specFilter;
    const matchesStatus = !statusFilter || d.status === statusFilter;

    return matchesSearch && matchesSpec && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedDoctors = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAdd = () => {
    setEditDoctor(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      specialization: '',
      qualification: '',
      experience: '',
      availableDays: 'Mon, Wed, Fri',
      availableTime: '09:00 AM - 05:00 PM',
      status: 'Available',
      imageUrl: '',
    });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditDoctor(d);
    setFormData({
      fullName: d.fullName || '',
      email: d.email || '',
      phone: d.phone || '',
      specialization: d.specialization || '',
      qualification: d.qualification || '',
      experience: d.experience || '',
      availableDays: d.availableDays || 'Mon, Wed, Fri',
      availableTime: d.availableTime || '09:00 AM - 05:00 PM',
      status: d.status || 'Available',
      imageUrl: d.imageUrl || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.specialization || !formData.qualification) {
      toast.warning('Please fill in all required doctor profile fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editDoctor) {
        await doctorApi.update(editDoctor.id, formData);
        toast.success(`Doctor profile for ${formData.fullName} updated.`);
      } else {
        const res = await doctorApi.create(formData);
        toast.success(`Doctor ${res.data?.doctorCode || ''} added successfully.`);
      }
      setShowModal(false);
      await fetchDoctors();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save doctor.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try {
      await doctorApi.delete(deleteConfirm.id);
      toast.success(`Doctor ${deleteConfirm.fullName} removed.`);
      setDeleteConfirm(null);
      await fetchDoctors();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Unable to delete doctor. Doctor has linked appointment or prescription records. Consider changing their status to Unavailable instead.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Doctor Management</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Directory of attending physicians, specialties, and clinical availability.
          </p>
        </div>
        {hasRole(['ADMIN']) && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            <span>Add Doctor</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search doctor name or code..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={specFilter}
          onChange={(e) => {
            setSpecFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Specializations</option>
          {specializations.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          {doctorStatuses.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDoctors} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="medical_services"
          title="No doctors found"
          description={
            search || specFilter || statusFilter
              ? 'Try adjusting your search criteria or reset filters.'
              : 'No doctors are currently registered in the directory.'
          }
          actionLabel={hasRole(['ADMIN']) ? 'Add Doctor' : undefined}
          onAction={openAdd}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedDoctors.map((d) => (
              <div
                key={d.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline-variant/50">
                      {d.imageUrl ? (
                        <img src={d.imageUrl} alt={d.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold text-lg">
                          {d.fullName?.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-on-surface truncate">{d.fullName}</h3>
                      <p className="text-xs font-bold text-primary">{d.specialization}</p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">{d.qualification}</p>
                      <p className="text-[11px] text-outline font-mono mt-0.5">{d.doctorCode}</p>
                    </div>
                    <StatusBadge status={d.status} size="xs" />
                  </div>

                  <div className="mt-4 pt-4 border-t border-surface-variant space-y-2 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-outline">work_history</span>
                      <span>Experience: <strong className="text-on-surface">{d.experience || 'Not specified'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-outline">calendar_month</span>
                      <span>Days: <strong className="text-on-surface">{d.availableDays || 'Mon - Fri'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-outline">schedule</span>
                      <span>Hours: <strong className="text-on-surface">{d.availableTime || '09:00 AM - 05:00 PM'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex border-t border-surface-variant divide-x divide-surface-variant bg-surface-container-low/30">
                  <button
                    onClick={() => setShowDetail(d)}
                    className="flex-1 py-2.5 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">visibility</span>
                    <span>View</span>
                  </button>

                  {hasRole(['ADMIN']) && (
                    <button
                      onClick={() => openEdit(d)}
                      className="flex-1 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      <span>Edit</span>
                    </button>
                  )}

                  {hasRole(['ADMIN']) && (
                    <button
                      onClick={() => setDeleteConfirm(d)}
                      className="flex-1 py-2.5 text-xs font-bold text-error hover:bg-error-container/10 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Add / Edit Doctor Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title={editDoctor ? 'Update Doctor Profile' : 'Add Attending Doctor'}
        subtitle={editDoctor ? `Doctor Code: ${editDoctor.doctorCode}` : 'Register a new physician'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                placeholder="e.g. Dr. Robert Chen"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="doctor@vitalsync.com"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="+91 98765 43210"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Specialization *
              </label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                required
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Select Specialization...</option>
                {specializations.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Medical Qualification *
              </label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                required
                placeholder="e.g. MBBS, MD (Cardiology)"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Years of Experience
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g. 12 Years"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Available Days
              </label>
              <input
                type="text"
                value={formData.availableDays}
                onChange={(e) => setFormData({ ...formData, availableDays: e.target.value })}
                placeholder="e.g. Mon, Wed, Fri"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Available Duty Hours
              </label>
              <input
                type="text"
                value={formData.availableTime}
                onChange={(e) => setFormData({ ...formData, availableTime: e.target.value })}
                placeholder="e.g. 09:00 AM - 05:00 PM"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Duty Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {doctorStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Photo URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <span>{editDoctor ? 'Save Changes' : 'Add Doctor'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Doctor Detail Modal */}
      {showDetail && (
        <Modal
          isOpen={true}
          onClose={() => setShowDetail(null)}
          title="Doctor Profile Details"
          subtitle={`Doctor Code: ${showDetail.doctorCode}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-2xl overflow-hidden border border-outline-variant/60 shadow-sm">
              {showDetail.imageUrl ? (
                <img src={showDetail.imageUrl} alt={showDetail.fullName} className="w-full h-full object-cover" />
              ) : (
                showDetail.fullName?.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface">{showDetail.fullName}</h3>
              <p className="text-sm font-bold text-primary">{showDetail.specialization}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{showDetail.qualification}</p>
              <div className="mt-2">
                <StatusBadge status={showDetail.status} size="xs" />
              </div>
            </div>

            <div className="text-left space-y-2.5 text-xs bg-surface p-4 rounded-xl border border-outline-variant/60">
              <p><strong className="text-on-surface">Email:</strong> {showDetail.email}</p>
              <p><strong className="text-on-surface">Phone:</strong> {showDetail.phone}</p>
              <p><strong className="text-on-surface">Experience:</strong> {showDetail.experience || 'N/A'}</p>
              <p><strong className="text-on-surface">Available Days:</strong> {showDetail.availableDays || 'Mon - Fri'}</p>
              <p><strong className="text-on-surface">Hours:</strong> {showDetail.availableTime || '09:00 AM - 05:00 PM'}</p>
            </div>

            {hasRole(['ADMIN']) && (
              <div className="flex justify-end gap-2 pt-4 border-t border-surface-variant">
                <button
                  onClick={() => {
                    setShowDetail(null);
                    openEdit(showDetail);
                  }}
                  className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors shadow-sm"
                >
                  Edit Doctor Profile
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Doctor Profile?"
        message={`Are you sure you want to delete ${deleteConfirm?.fullName}? If this doctor has existing patient appointments or prescriptions, deletion will be safely prevented.`}
        confirmText="Confirm Delete"
        loading={submitting}
      />
    </div>
  );
};

export default Doctors;
