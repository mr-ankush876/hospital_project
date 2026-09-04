import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { TableSkeleton } from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import PhoneNumberInput from '../components/common/PhoneNumberInput';

const Patients = () => {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: '',
    status: 'Active',
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, genderFilter, bloodFilter]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        gender: genderFilter || undefined,
        bloodGroup: bloodFilter || undefined,
      });
      setPatients(Array.isArray(res.data) ? res.data : res.data?.content || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('Unable to load patient records.');
      toast.error('Failed to load patient records.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedPatients = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAdd = () => {
    setEditPatient(null);
    setFormData({
      fullName: '',
      dob: '',
      age: '',
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '',
      email: '',
      address: '',
      emergencyContact: '',
      medicalHistory: '',
      allergies: '',
      status: 'Active',
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditPatient(p);
    setFormData({
      fullName: p.fullName || '',
      dob: p.dob || '',
      age: p.age || '',
      gender: p.gender || 'Male',
      bloodGroup: p.bloodGroup || 'O+',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      emergencyContact: p.emergencyContact || '',
      medicalHistory: p.medicalHistory || '',
      allergies: p.allergies || '',
      status: p.status || 'Active',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.dob || !formData.phone) {
      toast.warning('Please fill in required fields (Name, DOB, Phone).');
      return;
    }

    const selectedDob = new Date(formData.dob);
    if (selectedDob > new Date()) {
      toast.warning('Date of birth cannot be in the future.');
      return;
    }

    const cleanPhone = String(formData.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      toast.warning('Please enter a valid contact phone number (at least 7 digits).');
      return;
    }

    setSubmitting(true);
    try {
      if (editPatient) {
        await patientApi.update(editPatient.id, formData);
        toast.success(`Patient record for ${formData.fullName} updated.`);
      } else {
        const res = await patientApi.create(formData);
        toast.success(`Patient ${res.data?.patientCode || ''} registered successfully.`);
      }
      setShowModal(false);
      await fetchPatients();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save patient record.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try {
      await patientApi.delete(deleteConfirm.id);
      toast.success(`Patient ${deleteConfirm.fullName} removed.`);
      setDeleteConfirm(null);
      await fetchPatients();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete patient.';
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
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Patient Management</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Search, register, and maintain comprehensive clinical patient files.
          </p>
        </div>
        {hasRole(['ADMIN', 'RECEPTIONIST']) && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            <span>Register Patient</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            placeholder="Search by name, code, phone..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          value={genderFilter}
          onChange={(e) => {
            setGenderFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={bloodFilter}
          onChange={(e) => {
            setBloodFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Blood Groups</option>
          {bloodGroups.map((bg) => (
            <option key={bg} value={bg}>
              {bg}
            </option>
          ))}
        </select>
      </div>

      {/* Patient Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchPatients} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="person_off"
            title="No patients found"
            description={
              search || statusFilter || genderFilter || bloodFilter
                ? 'Try adjusting your search criteria or reset filters.'
                : 'No patients registered in the clinical system yet.'
            }
            actionLabel={hasRole(['ADMIN', 'RECEPTIONIST']) ? 'Register First Patient' : undefined}
            onAction={openAdd}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container-high border-b border-surface-variant">
                  <tr>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Patient Code</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Full Name</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Gender & Age</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Blood Group</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Contact Phone</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {paginatedPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-surface transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary whitespace-nowrap">
                        {p.patientCode}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setShowDetail(p)}
                          className="font-semibold text-on-surface hover:text-primary transition-colors text-left"
                        >
                          {p.fullName}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-on-surface-variant hidden md:table-cell whitespace-nowrap">
                        {p.gender} • {p.age} Yrs
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {p.bloodGroup}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-on-surface-variant hidden md:table-cell whitespace-nowrap">
                        {p.phone}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setShowDetail(p)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                            title="View Patient Record"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          {hasRole(['ADMIN', 'RECEPTIONIST']) && (
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                              title="Edit Patient"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                          )}
                          {hasRole(['ADMIN']) && (
                            <button
                              onClick={() => setDeleteConfirm(p)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors"
                              title="Delete Patient"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      </div>

      {/* Add / Edit Patient Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title={editPatient ? 'Update Patient File' : 'Register New Patient'}
        subtitle={editPatient ? `Patient ID: ${editPatient.patientCode}` : 'Create a new medical file'}
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
                placeholder="e.g. Johnathan Doe"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => {
                  const d = e.target.value;
                  const age = d ? Math.floor((Date.now() - new Date(d).getTime()) / 31557600000) : '';
                  setFormData({ ...formData, dob: d, age: age > 0 ? age : 0 });
                }}
                required
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Blood Group *
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <PhoneNumberInput
                label="Phone Number"
                required
                value={formData.phone}
                onChange={(val) => setFormData({ ...formData, phone: val })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="patient@example.com"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, city, state"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <PhoneNumberInput
                label="Emergency Contact Phone"
                value={formData.emergencyContact}
                onChange={(val) => setFormData({ ...formData, emergencyContact: val })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Known Allergies
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Peanuts, Sulfa"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Medical History / Chronic Conditions
              </label>
              <textarea
                rows={3}
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="e.g. Hypertension diagnosed 2021, Diabetes Type 2"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              <span>{editPatient ? 'Save Changes' : 'Register Patient'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Patient Detail Modal */}
      {showDetail && (
        <Modal
          isOpen={true}
          onClose={() => setShowDetail(null)}
          title="Patient Medical Profile"
          subtitle={`Patient ID: ${showDetail.patientCode}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-outline-variant">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xl flex-shrink-0">
                {showDetail.fullName?.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg text-on-surface">{showDetail.fullName}</h3>
                <p className="text-xs text-on-surface-variant font-mono">{showDetail.patientCode}</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={showDetail.status} size="xs" />
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {showDetail.bloodGroup}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface rounded-xl border border-outline-variant/60">
                <p className="text-outline uppercase font-semibold">Date of Birth</p>
                <p className="font-semibold text-sm text-on-surface mt-0.5">{showDetail.dob} ({showDetail.age} Yrs)</p>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-outline-variant/60">
                <p className="text-outline uppercase font-semibold">Gender</p>
                <p className="font-semibold text-sm text-on-surface mt-0.5">{showDetail.gender}</p>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-outline-variant/60">
                <p className="text-outline uppercase font-semibold">Phone Contact</p>
                <p className="font-semibold text-sm text-on-surface mt-0.5">{showDetail.phone}</p>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-outline-variant/60">
                <p className="text-outline uppercase font-semibold">Email Address</p>
                <p className="font-semibold text-sm text-on-surface mt-0.5 truncate">{showDetail.email || 'N/A'}</p>
              </div>
            </div>

            {showDetail.address && (
              <div className="p-3 bg-surface rounded-xl border border-outline-variant/60 text-xs">
                <p className="text-outline uppercase font-semibold">Residential Address</p>
                <p className="font-medium text-sm text-on-surface mt-0.5">{showDetail.address}</p>
              </div>
            )}

            {showDetail.allergies && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs">
                <p className="text-rose-800 uppercase font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Reported Allergies
                </p>
                <p className="font-semibold text-sm text-rose-900 mt-0.5">{showDetail.allergies}</p>
              </div>
            )}

            {showDetail.medicalHistory && (
              <div className="p-3 bg-surface rounded-xl border border-outline-variant/60 text-xs">
                <p className="text-outline uppercase font-semibold">Medical History</p>
                <p className="text-sm text-on-surface mt-0.5 whitespace-pre-wrap">{showDetail.medicalHistory}</p>
              </div>
            )}

            {hasRole(['ADMIN', 'RECEPTIONIST']) && (
              <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant">
                <Link
                  to={`/medical-reports`}
                  onClick={() => setShowDetail(null)}
                  className="px-4 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-bold text-xs sm:text-sm hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">description</span>
                  <span>Medical Reports</span>
                </Link>
                <button
                  onClick={() => {
                    setShowDetail(null);
                    openEdit(showDetail);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:bg-primary-container transition-colors shadow-sm"
                >
                  Edit Profile
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
        title="Delete Patient Record?"
        message={`Are you sure you want to permanently remove ${deleteConfirm?.fullName} (${deleteConfirm?.patientCode}) from the clinical system? Note: In accordance with clinical governance, all active appointments must be cancelled/completed, bed admissions discharged, and medical reports finalized before deletion is permitted.`}
        confirmText="Confirm Delete"
        loading={submitting}
      />
    </div>
  );
};

export default Patients;
