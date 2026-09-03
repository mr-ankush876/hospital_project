import React, { useState, useEffect } from 'react';
import { medicalReportApi, patientApi, doctorApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import VitalSyncLogo from '../../components/common/VitalSyncLogo';

const MedicalReportsAdmin = () => {
  const { user, hasRole } = useAuth();
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals & States
  const [modalOpen, setModalOpen] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [printTarget, setPrintTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    patientId: '',
    doctorId: '',
    departmentName: 'Pathology & Diagnostics',
    reportType: 'Complete Blood Count (CBC)',
    reportDate: new Date().toISOString().split('T')[0],
    symptoms: '',
    diagnosis: '',
    testResults: '',
    doctorNotes: '',
    status: 'Final',
  };

  const [form, setForm] = useState(initialFormState);

  const reportTypeOptions = [
    'Complete Blood Count (CBC)',
    '12-Lead Electrocardiogram (ECG)',
    'Chest X-Ray (PA View)',
    'Magnetic Resonance Imaging (3T MRI Brain)',
    'Abdominal Ultrasound (USG)',
    'Comprehensive Metabolic Panel (CMP)',
    'Lipid Profile & Cardiac Risk Panel',
    'Routine Urinalysis & Microscopy',
    'Arterial Blood Gas (ABG) Analysis',
    'Histopathology Biopsy Evaluation',
    'Thyroid Function Panel (FT3, FT4, TSH)',
    'Serum Electrolytes Panel',
    'COVID-19 / Respiratory RT-PCR',
  ];

  const departmentOptions = [
    'Pathology & Diagnostics',
    'Cardiology & Cardiac Electrophysiology',
    'Radiology & Clinical Imaging',
    'Biochemistry & Immunoassay',
    'Microbiology & Serology',
    'Neurology Diagnostics',
    'Emergency & Critical Care Lab',
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, dRes] = await Promise.allSettled([
        medicalReportApi.getAll(),
        patientApi.getAll(),
        doctorApi.getAll(),
      ]);

      if (rRes.status === 'fulfilled') {
        const fetched = Array.isArray(rRes.value.data) ? rRes.value.data : rRes.value.data?.content || [];
        setReports(fetched);
      }
      if (pRes.status === 'fulfilled') {
        const pts = Array.isArray(pRes.value.data) ? pRes.value.data : pRes.value.data?.content || [];
        setPatients(pts);
      }
      if (dRes.status === 'fulfilled') {
        const docs = Array.isArray(dRes.value.data) ? dRes.value.data : dRes.value.data?.content || [];
        setDoctors(docs);
      }
    } catch (err) {
      console.error('Error fetching medical reports:', err);
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPublishModal = () => {
    setEditReport(null);
    setForm({
      patientId: patients.length > 0 ? patients[0].id : '',
      doctorId: doctors.length > 0 ? doctors[0].id : '',
      departmentName: 'Pathology & Diagnostics',
      reportType: 'Complete Blood Count (CBC)',
      reportDate: new Date().toISOString().split('T')[0],
      symptoms: '',
      diagnosis: '',
      testResults: '',
      doctorNotes: '',
      status: 'Final',
    });
    setModalOpen(true);
  };

  const openEditModal = (rep) => {
    setEditReport(rep);
    setForm({
      patientId: rep.patientId || rep.patient?.id || '',
      doctorId: rep.doctorId || rep.doctor?.id || '',
      departmentName: rep.departmentName || 'Pathology & Diagnostics',
      reportType: rep.reportType || 'Complete Blood Count (CBC)',
      reportDate: rep.reportDate || new Date().toISOString().split('T')[0],
      symptoms: rep.symptoms || '',
      diagnosis: rep.diagnosis || '',
      testResults: rep.testResults || '',
      doctorNotes: rep.doctorNotes || '',
      status: rep.status || 'Final',
    });
    setModalOpen(true);
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.diagnosis.trim()) {
      toast.warning('Please provide patient, doctor, and diagnostic impression.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        departmentName: form.departmentName,
        reportType: form.reportType,
        reportDate: form.reportDate,
        symptoms: form.symptoms,
        diagnosis: form.diagnosis,
        testResults: form.testResults,
        doctorNotes: form.doctorNotes,
        status: form.status,
      };

      if (editReport) {
        const res = await medicalReportApi.update(editReport.id, payload);
        toast.success(`Medical report ${res.data?.reportCode || editReport.reportCode} updated successfully.`);
        if (showDetail && showDetail.id === editReport.id) {
          setShowDetail(res.data);
        }
      } else {
        const res = await medicalReportApi.create(payload);
        toast.success(`Medical report ${res.data?.reportCode} published successfully.`);
      }

      setModalOpen(false);
      setEditReport(null);
      await fetchData();
    } catch (err) {
      console.error('Save report error:', err);
      toast.error(err?.response?.data?.message || 'Failed to save medical report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try {
      await medicalReportApi.delete(deleteConfirm.id);
      toast.success(`Medical report ${deleteConfirm.reportCode} deleted.`);
      setDeleteConfirm(null);
      if (showDetail && showDetail.id === deleteConfirm.id) {
        setShowDetail(null);
      }
      await fetchData();
    } catch (err) {
      console.error('Delete report error:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (rep) => {
    setPrintTarget(rep);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Filter logic
  const filteredReports = reports.filter((rep) => {
    if (search) {
      const q = search.toLowerCase();
      const codeMatch = rep.reportCode?.toLowerCase().includes(q);
      const patientMatch = rep.patientName?.toLowerCase().includes(q) || rep.patientCode?.toLowerCase().includes(q);
      const docMatch = rep.doctorName?.toLowerCase().includes(q);
      const typeMatch = rep.reportType?.toLowerCase().includes(q);
      const diagMatch = rep.diagnosis?.toLowerCase().includes(q);
      if (!codeMatch && !patientMatch && !docMatch && !typeMatch && !diagMatch) return false;
    }
    if (statusFilter && rep.status !== statusFilter) return false;
    if (doctorFilter && String(rep.doctorId) !== String(doctorFilter)) return false;
    if (typeFilter && rep.reportType !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;
  const paginatedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'FINAL':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PRELIMINARY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Clinical Medical Reports</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Laboratory investigations, diagnostic test results, pathology evaluations, and imaging archives.
          </p>
        </div>

        {hasRole(['ADMIN', 'DOCTOR']) && (
          <button
            onClick={openPublishModal}
            className="bg-primary text-on-primary font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Publish New Report</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search report code, patient, diagnosis..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={doctorFilter}
          onChange={(e) => {
            setDoctorFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Attending Doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName} ({d.specialization})
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Report Statuses</option>
          <option value="Final">Final (Verified & Approved)</option>
          <option value="Preliminary">Preliminary (Interim Results)</option>
          <option value="Pending">Pending (Processing / Lab Review)</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Diagnostic Test Types</option>
          {reportTypeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader message="Loading diagnostic reports..." />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="description"
              title="No Medical Reports Found"
              description={
                search || statusFilter || doctorFilter || typeFilter
                  ? 'No diagnostic reports match the selected filters.'
                  : 'No clinical reports have been published yet.'
              }
              actionLabel={hasRole(['ADMIN', 'DOCTOR']) ? 'Publish First Report' : undefined}
              onAction={openPublishModal}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-high text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                  <tr>
                    <th className="py-3.5 px-4">Report Code</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Attending Doctor</th>
                    <th className="py-3.5 px-4">Test Name</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Date</th>
                    <th className="py-3.5 px-4">Diagnostic Impression</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {paginatedReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-surface transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                        <button
                          onClick={() => setShowDetail(rep)}
                          className="hover:underline flex items-center gap-1 text-primary font-bold"
                          title="Check report details"
                        >
                          <span>{rep.reportCode}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setShowDetail(rep)}
                          className="font-bold text-on-surface hover:text-primary transition-colors text-left"
                        >
                          {rep.patientName || 'Patient'}
                        </button>
                        <p className="font-mono text-[11px] text-on-surface-variant">{rep.patientCode || 'PT-ID'}</p>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <p className="font-bold text-on-surface">{rep.doctorName || 'Doctor'}</p>
                        <p className="text-on-surface-variant text-[11px] truncate max-w-[160px]">{rep.departmentName}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-on-surface whitespace-nowrap">
                        {rep.reportType}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap hidden sm:table-cell">
                        {rep.reportDate}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface max-w-xs truncate font-medium">
                        {rep.diagnosis || 'Clinical evaluation completed'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(rep.status)}`}>
                          {rep.status || 'Final'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. View / Check Button */}
                          <button
                            onClick={() => setShowDetail(rep)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                            title="Check / View Report"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>

                          {/* 2. Print Report Button */}
                          <button
                            onClick={() => handlePrint(rep)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                            title="Print Report"
                          >
                            <span className="material-symbols-outlined text-lg">print</span>
                          </button>

                          {/* 3. Edit Report Button */}
                          {hasRole(['ADMIN', 'DOCTOR']) && (
                            <button
                              onClick={() => openEditModal(rep)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                              title="Edit Report"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                          )}

                          {/* 4. Delete Report Button (Admin Only) */}
                          {hasRole(['ADMIN']) && (
                            <button
                              onClick={() => setDeleteConfirm(rep)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors"
                              title="Delete Report"
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
              totalItems={filteredReports.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* 1. View / Check Report Details Modal */}
      {showDetail && (
        <Modal
          isOpen={true}
          onClose={() => setShowDetail(null)}
          title="Clinical Diagnostic Report"
          subtitle={`Reference: ${showDetail.reportCode}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Header / Meta Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-outline-variant">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Patient Information</p>
                <h3 className="font-bold text-base text-on-surface mt-0.5">{showDetail.patientName}</h3>
                <p className="text-xs text-on-surface-variant font-mono">
                  ID: {showDetail.patientCode}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Attending Specialist</p>
                <p className="font-bold text-sm text-on-surface mt-0.5">{showDetail.doctorName || 'Assigned Physician'}</p>
                <p className="text-xs text-on-surface-variant">{showDetail.departmentName}</p>
                <div className="mt-1 flex sm:justify-end items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(showDetail.status)}`}>
                    Status: {showDetail.status || 'Final'}
                  </span>
                  <span className="text-[11px] text-outline font-mono">{showDetail.reportDate}</span>
                </div>
              </div>
            </div>

            {/* Test Type Banner */}
            <div className="p-3 bg-surface-container-high/40 rounded-xl border border-surface-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">biotech</span>
                <span className="font-bold text-sm text-on-surface">{showDetail.reportType}</span>
              </div>
              <span className="text-xs text-on-surface-variant font-semibold">{showDetail.departmentName}</span>
            </div>

            {/* Symptoms & Diagnosis */}
            <div className="space-y-3">
              {showDetail.symptoms && (
                <div className="p-3 rounded-xl bg-surface border border-outline-variant text-xs">
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Clinical Indications / Symptoms</p>
                  <p className="font-medium text-sm text-on-surface mt-0.5">{showDetail.symptoms}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-surface border border-outline-variant text-xs">
                <p className="text-[10px] uppercase font-bold text-primary tracking-wider">Diagnostic Impression / Summary</p>
                <p className="font-bold text-sm text-on-surface mt-0.5">{showDetail.diagnosis}</p>
              </div>
            </div>

            {/* Detailed Laboratory Results */}
            {showDetail.testResults ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Detailed Laboratory Findings & Biomarkers
                </p>
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant font-mono text-xs text-on-surface whitespace-pre-wrap leading-relaxed">
                  {showDetail.testResults}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface border border-outline-variant/60 text-xs text-on-surface-variant italic">
                No raw biomarker metrics recorded. Diagnostic impression verified.
              </div>
            )}

            {/* Doctor Notes & Recommendations */}
            {showDetail.doctorNotes && (
              <div className="p-3.5 rounded-xl bg-surface border border-outline-variant text-xs">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Doctor Recommendations & Follow-Up</p>
                <p className="text-xs text-on-surface mt-1 whitespace-pre-wrap">{showDetail.doctorNotes}</p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-variant">
              {hasRole(['ADMIN', 'DOCTOR']) ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = showDetail;
                    setShowDetail(null);
                    openEditModal(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-surface border border-outline-variant hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Edit Report</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint(showDetail)}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>Print Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetail(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface font-semibold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Publish / Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !submitting && setModalOpen(false)}
          title={editReport ? 'Edit Medical Diagnostic Report' : 'Publish Clinical Medical Report'}
          subtitle={editReport ? `Updating Code: ${editReport.reportCode}` : 'Create official pathology or diagnostic record'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveReport} className="space-y-4">
            {/* Patient & Doctor Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Patient *
                </label>
                <select
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.patientCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Attending Doctor *
                </label>
                <select
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Test Type & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Report / Test Type *
                </label>
                <input
                  type="text"
                  required
                  list="report-type-presets"
                  value={form.reportType}
                  onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                  placeholder="e.g. Complete Blood Count (CBC)"
                  className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
                />
                <datalist id="report-type-presets">
                  {reportTypeOptions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  list="department-presets"
                  value={form.departmentName}
                  onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                  placeholder="e.g. Pathology & Diagnostics"
                  className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
                />
                <datalist id="department-presets">
                  {departmentOptions.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Investigation Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.reportDate}
                  onChange={(e) => setForm({ ...form, reportDate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Report Status *
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Final">Final (Verified & Approved)</option>
                  <option value="Preliminary">Preliminary (Interim Results)</option>
                  <option value="Pending">Pending (Under Lab Investigation)</option>
                </select>
              </div>
            </div>

            {/* Clinical Indications / Symptoms */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Clinical Indications / Symptoms
              </label>
              <input
                type="text"
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                placeholder="e.g. Chronic fatigue, mild dyspnea, persistent fever"
                className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Diagnostic Impression / Summary */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Diagnostic Impression / Result Summary *
              </label>
              <input
                type="text"
                required
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="e.g. Mild microcytic hypochromic anemia, within normal limits otherwise"
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
              />
            </div>

            {/* Detailed Laboratory Results */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Detailed Laboratory Findings / Biomarkers
              </label>
              <textarea
                rows="4"
                value={form.testResults}
                onChange={(e) => setForm({ ...form, testResults: e.target.value })}
                placeholder="WBC: 6.8 x 10^3/uL (Ref: 4.5-11.0)&#10;Hemoglobin: 11.2 g/dL (Ref: 13.5-17.5)&#10;Platelets: 240 x 10^3/uL (Ref: 150-450)&#10;MCV: 74 fL (Ref: 80-100)"
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface font-mono focus:outline-none focus:border-primary"
              />
            </div>

            {/* Doctor Recommendation */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Doctor Recommendations & Follow-Up Notes
              </label>
              <textarea
                rows="2"
                value={form.doctorNotes}
                onChange={(e) => setForm({ ...form, doctorNotes: e.target.value })}
                placeholder="Advised oral iron supplementation and re-evaluate CBC in 4 weeks."
                className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex justify-end gap-2 border-t border-surface-variant">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface border border-outline-variant transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {submitting && (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{editReport ? 'Save Changes' : 'Publish Report'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Medical Report?"
        message={`Are you sure you want to permanently delete diagnostic report ${deleteConfirm?.reportCode} for ${deleteConfirm?.patientName}?`}
        confirmText="Confirm Delete"
        loading={submitting}
      />

      {/* 4. Official Printable Report Area for Browser Printing */}
      {printTarget && (
        <div className="hidden print:block printable-area p-8 max-w-3xl mx-auto bg-white text-black font-sans">
          {/* Header with Hospital Banner */}
          <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-6">
            <div className="flex items-center gap-3">
              <VitalSyncLogo className="w-12 h-12" showText={true} />
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-sm text-gray-900">VitalSync Multi-Specialty Hospital</p>
              <p className="text-gray-600">Department of Pathology & Clinical Diagnostics</p>
              <p className="text-gray-600">Medical Center Road, Healthcare City â€¢ Emergency: 108</p>
              <p className="text-gray-500 text-[10px]">ISO 15189:2022 Certified Medical Laboratory</p>
            </div>
          </div>

          {/* Report Code & Status */}
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg mb-5 text-xs font-semibold">
            <div>
              <span>Report Code: </span>
              <strong className="text-primary font-mono text-sm">{printTarget.reportCode}</strong>
            </div>
            <div>
              <span>Status: </span>
              <strong className="uppercase">{printTarget.status || 'FINAL'}</strong>
            </div>
            <div>
              <span>Date: </span>
              <strong>{printTarget.reportDate}</strong>
            </div>
          </div>

          {/* Demographics Grid */}
          <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4 mb-5 text-xs">
            <div>
              <p className="text-gray-500 font-bold uppercase text-[10px]">Patient Name</p>
              <p className="font-bold text-sm text-gray-900">{printTarget.patientName}</p>
              <p className="text-gray-600 font-mono">Patient Code: {printTarget.patientCode}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase text-[10px]">Attending Consultant</p>
              <p className="font-bold text-sm text-gray-900">{printTarget.doctorName || 'Staff Specialist'}</p>
              <p className="text-gray-600">{printTarget.departmentName}</p>
            </div>
          </div>

          {/* Test Type Header */}
          <div className="bg-gray-50 border-l-4 border-primary p-3 rounded mb-5">
            <p className="text-xs text-gray-500 uppercase font-bold">Investigation Requested</p>
            <p className="font-bold text-sm text-gray-900">{printTarget.reportType}</p>
          </div>

          {/* Symptoms */}
          {printTarget.symptoms && (
            <div className="mb-4 text-xs">
              <p className="font-bold text-gray-700 uppercase text-[10px]">Clinical Symptoms / Indication</p>
              <p className="text-gray-800 mt-0.5">{printTarget.symptoms}</p>
            </div>
          )}

          {/* Diagnosis */}
          <div className="mb-5 text-xs">
            <p className="font-bold text-primary uppercase text-[10px]">Diagnostic Impression / Conclusion</p>
            <p className="font-bold text-sm text-gray-900 mt-0.5">{printTarget.diagnosis}</p>
          </div>

          {/* Detailed Results */}
          {printTarget.testResults && (
            <div className="mb-6">
              <p className="font-bold text-gray-700 uppercase text-[10px] mb-1">Laboratory Findings & Measured Biomarkers</p>
              <div className="bg-gray-50 border border-gray-200 rounded p-4 font-mono text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">
                {printTarget.testResults}
              </div>
            </div>
          )}

          {/* Doctor Notes */}
          {printTarget.doctorNotes && (
            <div className="mb-8 text-xs bg-blue-50/50 border border-blue-100 rounded p-3">
              <p className="font-bold text-blue-900 uppercase text-[10px]">Doctor Clinical Recommendations</p>
              <p className="text-blue-950 mt-1">{printTarget.doctorNotes}</p>
            </div>
          )}

          {/* Signatures Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 flex justify-between items-end text-xs">
            <div className="text-[10px] text-gray-500 max-w-xs">
              <p>This document is an authenticated clinical laboratory report generated via VitalSync HMS.</p>
              <p className="mt-1">Electronically verified by Department of Pathology.</p>
            </div>
            <div className="text-center">
              <div className="w-44 border-b border-gray-400 mb-1" />
              <p className="font-bold text-gray-900">{printTarget.doctorName || 'Authorized Pathologist'}</p>
              <p className="text-[10px] text-gray-500">Consultant In-Charge</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReportsAdmin;