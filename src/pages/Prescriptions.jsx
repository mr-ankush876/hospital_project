import React, { useState, useEffect, useRef } from 'react';
import { prescriptionApi, patientApi, doctorApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { TableSkeleton } from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import VitalSyncLogo from '../components/common/VitalSyncLogo';

const Prescriptions = () => {
  const { user, hasRole } = useAuth();
  const toast = useToast();

  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals & States
  const [showModal, setShowModal] = useState(false);
  const [editPrescription, setEditPrescription] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [printTarget, setPrintTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    symptoms: '',
    diagnosis: '',
    instructions: '',
    followUpDate: '',
    medicines: [
      { medicineName: '', dosage: '1 Tab', frequency: '1-0-1 (BID)', duration: '5 Days' }
    ],
  });

  const frequencyOptions = [
    '1-0-0 (OD - Morning)',
    '0-1-0 (OD - Afternoon)',
    '0-0-1 (OD - Night)',
    '1-0-1 (BID - Twice daily)',
    '1-1-1 (TID - Thrice daily)',
    '1-1-1-1 (QID - 4 times daily)',
    'SOS (As needed)',
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rxRes, patRes, docRes] = await Promise.all([
        prescriptionApi.getAll(),
        patientApi.getAll(),
        doctorApi.getAll(),
      ]);

      setPrescriptions(Array.isArray(rxRes.data) ? rxRes.data : rxRes.data?.content || []);
      setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data?.content || []);
      setDoctors(Array.isArray(docRes.data) ? docRes.data : docRes.data?.content || []);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
      setError('Unable to retrieve clinical prescriptions.');
      toast.error('Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrescriptions();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPrescriptions = async () => {
    try {
      const res = await prescriptionApi.getAll({ search: search || undefined });
      setPrescriptions(Array.isArray(res.data) ? res.data : res.data?.content || []);
    } catch (err) {
      console.error('Failed to refresh prescriptions:', err);
    }
  };

  const filtered = prescriptions;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedPrescriptions = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAddModal = () => {
    setEditPrescription(null);
    let defaultDocId = doctors.length > 0 ? doctors[0].id : '';
    if (user?.role === 'DOCTOR') {
      const currentDoc = doctors.find((d) => d.email === user.email || d.fullName === user.fullName);
      if (currentDoc) defaultDocId = currentDoc.id;
    }

    setFormData({
      patientId: patients.length > 0 ? patients[0].id : '',
      doctorId: defaultDocId,
      prescriptionDate: new Date().toISOString().split('T')[0],
      symptoms: '',
      diagnosis: '',
      instructions: 'Take medicines after meals with plenty of water.',
      followUpDate: '',
      medicines: [
        { medicineName: '', dosage: '1 Tab', frequency: '1-0-1 (BID)', duration: '5 Days' }
      ],
    });
    setShowModal(true);
  };

  const openEditModal = (rx) => {
    setEditPrescription(rx);
    setFormData({
      patientId: rx.patient?.id || rx.patientId || '',
      doctorId: rx.doctor?.id || rx.doctorId || '',
      prescriptionDate: rx.prescriptionDate || '',
      symptoms: rx.symptoms || '',
      diagnosis: rx.diagnosis || '',
      instructions: rx.instructions || '',
      followUpDate: rx.followUpDate || '',
      medicines: rx.medicines && rx.medicines.length > 0 ? rx.medicines : [
        { medicineName: '', dosage: '1 Tab', frequency: '1-0-1 (BID)', duration: '5 Days' }
      ],
    });
    setShowModal(true);
  };

  const handleAddMedicineRow = () => {
    setFormData((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { medicineName: '', dosage: '1 Tab', frequency: '1-0-1 (BID)', duration: '5 Days' }
      ]
    }));
  };

  const handleRemoveMedicineRow = (index) => {
    if (formData.medicines.length === 1) {
      toast.warning('At least one medicine item is required.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.diagnosis) {
      toast.warning('Please provide patient, doctor and diagnosis.');
      return;
    }

    // Validate medicines
    const validMeds = formData.medicines.filter((m) => m.medicineName.trim());
    if (validMeds.length === 0) {
      toast.warning('Please add at least one valid medication with name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData, medicines: validMeds };
      if (editPrescription) {
        await prescriptionApi.update(editPrescription.id, payload);
        toast.success(`Prescription ${editPrescription.prescriptionCode} updated.`);
      } else {
        const res = await prescriptionApi.create(payload);
        toast.success(`Prescription ${res.data?.prescriptionCode || ''} created.`);
      }
      setShowModal(false);
      await fetchPrescriptions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save prescription.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try {
      await prescriptionApi.delete(deleteConfirm.id);
      toast.success(`Prescription ${deleteConfirm.prescriptionCode} deleted.`);
      setDeleteConfirm(null);
      await fetchPrescriptions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete prescription.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (rx) => {
    setPrintTarget(rx);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Prescription Management</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Create, issue, and manage clinical prescriptions & medicines.
          </p>
        </div>
        {hasRole(['ADMIN', 'DOCTOR']) && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Issue Prescription</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
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
            placeholder="Search by patient, doctor, code, diagnosis..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Prescription List */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="prescriptions"
            title="No prescriptions found"
            description={
              search
                ? 'No prescriptions match your search query.'
                : 'No patient prescriptions have been created yet.'
            }
            actionLabel={hasRole(['ADMIN', 'DOCTOR']) ? 'Create First Prescription' : undefined}
            onAction={openAddModal}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container-high border-b border-surface-variant">
                  <tr>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Rx Code</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Patient</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Doctor</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Diagnosis</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Medicines</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Date</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {paginatedPrescriptions.map((rx) => {
                    const patientName = rx.patient?.fullName || rx.patientName || 'Patient';
                    const doctorName = rx.doctor?.fullName || rx.doctorName || 'Doctor';
                    const medCount = rx.medicines?.length || 0;

                    return (
                      <tr key={rx.id} className="hover:bg-surface transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary whitespace-nowrap">
                          {rx.prescriptionCode}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-on-surface">
                          <button
                            onClick={() => setShowDetail(rx)}
                            className="hover:text-primary transition-colors text-left"
                          >
                            {patientName}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant hidden md:table-cell">
                          {doctorName}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-on-surface max-w-xs truncate font-medium">
                          {rx.diagnosis || 'Clinical evaluation'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                            {medCount} {medCount === 1 ? 'Med' : 'Meds'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant whitespace-nowrap">
                          {rx.prescriptionDate}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handlePrint(rx)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                              title="Print Prescription"
                            >
                              <span className="material-symbols-outlined text-lg">print</span>
                            </button>
                            <button
                              onClick={() => setShowDetail(rx)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                              title="View Details"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                            {hasRole(['ADMIN', 'DOCTOR']) && (
                              <button
                                onClick={() => openEditModal(rx)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                                title="Edit Prescription"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                            )}
                            {hasRole(['ADMIN']) && (
                              <button
                                onClick={() => setDeleteConfirm(rx)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Create / Edit Prescription Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title={editPrescription ? 'Edit Prescription' : 'Issue New Prescription'}
        subtitle={editPrescription ? `Editing ${editPrescription.prescriptionCode}` : 'Digital Rx & Medication Chart'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface border border-outline-variant">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Patient *
              </label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Select Patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.patientCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Prescribing Doctor *
              </label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Select Doctor...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Prescription Date *
              </label>
              <input
                type="date"
                value={formData.prescriptionDate}
                onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Clinical Notes & Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Symptoms / Chief Complaint
              </label>
              <input
                type="text"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="e.g. Mild chest tightness, fever, cough"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Diagnosis *
              </label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                required
                placeholder="e.g. Stage 1 Primary Hypertension"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Dynamic Medicines Table */}
          <div className="border border-outline-variant rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 bg-surface-container-high border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">medication</span>
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">Prescribed Medications</h3>
              </div>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:bg-primary-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="p-4 space-y-3 bg-surface-container-lowest">
              {formData.medicines.map((med, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2.5 p-2 rounded-lg bg-surface border border-outline-variant/60">
                  <div className="flex-1 w-full sm:w-auto">
                    <input
                      type="text"
                      value={med.medicineName}
                      onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                      placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                      required
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="w-full sm:w-28">
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                      placeholder="Dosage (1 Tab)"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="w-full sm:w-44">
                    <select
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      {frequencyOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-28">
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                      placeholder="Duration (5 Days)"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedicineRow(idx)}
                    className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/10 transition-colors"
                    title="Remove Medicine"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions & Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Patient Instructions / Diet / Advice
              </label>
              <textarea
                rows={2}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Specific instructions for taking medicines..."
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Form Actions */}
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
              <span>{editPrescription ? 'Save Prescription' : 'Issue Prescription'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Prescription Detail Drawer / Modal */}
      {showDetail && (
        <Modal
          isOpen={true}
          onClose={() => setShowDetail(null)}
          title="Prescription Details"
          subtitle={`Reference: ${showDetail.prescriptionCode}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start p-4 rounded-xl bg-surface border border-outline-variant">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Patient</p>
                <p className="font-bold text-base text-on-surface mt-0.5">{showDetail.patient?.fullName || showDetail.patientName}</p>
                <p className="text-xs text-on-surface-variant">
                  {showDetail.patient?.patientCode} • {showDetail.patient?.gender} • {showDetail.patient?.age} Yrs
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Doctor</p>
                <p className="font-bold text-sm text-on-surface mt-0.5">{showDetail.doctor?.fullName || showDetail.doctorName}</p>
                <p className="text-xs text-outline">{showDetail.prescriptionDate}</p>
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Diagnosis & Symptoms</p>
              <div className="p-3 rounded-lg bg-surface border border-outline-variant text-sm space-y-1">
                <p><strong className="text-on-surface">Diagnosis:</strong> {showDetail.diagnosis}</p>
                {showDetail.symptoms && <p><strong className="text-on-surface">Symptoms:</strong> {showDetail.symptoms}</p>}
              </div>
            </div>

            {/* Medications List */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Prescribed Medications</p>
              <div className="border border-outline-variant rounded-xl overflow-hidden divide-y divide-surface-variant">
                {showDetail.medicines?.map((med, idx) => (
                  <div key={idx} className="p-3 bg-surface-container-lowest flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-on-surface">{med.medicineName}</p>
                      <p className="text-xs text-on-surface-variant">{med.dosage} — {med.frequency}</p>
                    </div>
                    <span className="font-semibold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {med.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {showDetail.instructions && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Special Instructions</p>
                <p className="p-3 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface mt-1">
                  {showDetail.instructions}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant">
              <button
                onClick={() => handlePrint(showDetail)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-base">print</span>
                <span>Print Prescription</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Prescription?"
        message={`Are you sure you want to permanently delete prescription ${deleteConfirm?.prescriptionCode}?`}
        confirmText="Delete Prescription"
        loading={submitting}
      />

      {/* Hidden Printable Area for Browser Printing */}
      {printTarget && (
        <div className="hidden print:block printable-area p-8 max-w-3xl mx-auto bg-white text-black font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-6">
            <div className="flex items-center gap-3">
              <VitalSyncLogo className="w-12 h-12" showText={true} />
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-sm">VitalSync Multi-Specialty Hospital</p>
              <p>Medical Center Road, Healthcare City</p>
              <p>Phone: +91 (800) 123-4567 | Reg: VS-HOSP-2026</p>
            </div>
          </div>

          {/* Rx Code & Date */}
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded mb-4 text-xs font-semibold">
            <span>Prescription No: <strong>{printTarget.prescriptionCode}</strong></span>
            <span>Date: <strong>{printTarget.prescriptionDate}</strong></span>
          </div>

          {/* Patient and Doctor Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
            <div className="border border-gray-300 p-3 rounded">
              <p className="font-bold text-gray-700 uppercase mb-1">Patient Information</p>
              <p className="font-bold text-sm">{printTarget.patient?.fullName || printTarget.patientName}</p>
              <p>ID: {printTarget.patient?.patientCode} | Age: {printTarget.patient?.age} Yrs | Gender: {printTarget.patient?.gender}</p>
              <p>Blood Group: {printTarget.patient?.bloodGroup} | Phone: {printTarget.patient?.phone}</p>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <p className="font-bold text-gray-700 uppercase mb-1">Attending Physician</p>
              <p className="font-bold text-sm">{printTarget.doctor?.fullName || printTarget.doctorName}</p>
              <p>Specialization: {printTarget.doctor?.specialization}</p>
              <p>Qualification: {printTarget.doctor?.qualification}</p>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="mb-6 text-xs">
            <p className="font-bold uppercase text-gray-700 mb-1">Clinical Diagnosis</p>
            <p className="p-2 border border-gray-300 rounded font-semibold text-gray-900 bg-gray-50">
              {printTarget.diagnosis}
            </p>
          </div>

          {/* Rx Symbol & Medication Table */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-serif font-bold text-primary">℞</span>
              <span className="font-bold text-xs uppercase tracking-wider text-gray-700">Medication Schedule</span>
            </div>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 p-2 text-left">#</th>
                  <th className="border border-gray-300 p-2 text-left">Medicine Name</th>
                  <th className="border border-gray-300 p-2 text-left">Dosage</th>
                  <th className="border border-gray-300 p-2 text-left">Frequency</th>
                  <th className="border border-gray-300 p-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                {printTarget.medicines?.map((m, idx) => (
                  <tr key={idx} className="border border-gray-300">
                    <td className="border border-gray-300 p-2 font-mono">{idx + 1}</td>
                    <td className="border border-gray-300 p-2 font-bold">{m.medicineName}</td>
                    <td className="border border-gray-300 p-2">{m.dosage}</td>
                    <td className="border border-gray-300 p-2">{m.frequency}</td>
                    <td className="border border-gray-300 p-2">{m.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Instructions & Follow-up */}
          <div className="grid grid-cols-2 gap-4 mb-12 text-xs">
            <div>
              <p className="font-bold uppercase text-gray-700 mb-1">Advice & Instructions</p>
              <p className="p-2 border border-gray-300 rounded min-h-[50px]">{printTarget.instructions || 'Take as directed.'}</p>
            </div>
            <div>
              <p className="font-bold uppercase text-gray-700 mb-1">Next Follow-up</p>
              <p className="p-2 border border-gray-300 rounded min-h-[50px] font-semibold">
                {printTarget.followUpDate || 'As needed / Upon completion of course'}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-12 border-t border-gray-300 text-xs">
            <div>
              <p className="text-gray-500">System generated on {new Date().toLocaleString()}</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-gray-500 mb-1" />
              <p className="font-bold">{printTarget.doctor?.fullName || printTarget.doctorName}</p>
              <p className="text-gray-500">Doctor Signature & Stamp</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
