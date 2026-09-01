import React, { useState, useEffect } from 'react';
import { medicalReportApi, patientApi, doctorApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const MedicalReportsAdmin = () => {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
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
  });

  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, dRes] = await Promise.allSettled([
        medicalReportApi.getAll(),
        patientApi.getAll(),
        doctorApi.getAll(),
      ]);

      if (rRes.status === 'fulfilled') setReports(rRes.value.data || []);
      if (pRes.status === 'fulfilled') {
        const pts = pRes.value.data || [];
        setPatients(pts);
        if (pts.length > 0 && !form.patientId) {
          setForm((prev) => ({ ...prev, patientId: pts[0].id }));
        }
      }
      if (dRes.status === 'fulfilled') {
        const docs = dRes.value.data || [];
        setDoctors(docs);
        if (docs.length > 0 && !form.doctorId) {
          setForm((prev) => ({ ...prev, doctorId: docs[0].id }));
        }
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

  const handleCreateReport = async (e) => {
    e.preventDefault();
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

      const res = await medicalReportApi.create(payload);
      toast.success(`Medical report ${res.data?.reportCode} issued successfully.`);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Create report error:', err);
      toast.error(err?.response?.data?.message || 'Failed to create report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Clinical Medical Reports</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Diagnostic laboratory pathology investigations and diagnostic test records.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Publish New Report</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader message="Loading diagnostic reports..." />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="description"
              title="No Medical Reports"
              description="No clinical reports have been published yet."
              actionLabel="Publish Report"
              onAction={() => setModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                <tr>
                  <th className="py-3.5 px-6">Report Code</th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Doctor & Department</th>
                  <th className="py-3.5 px-6">Test Type</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Impression</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-primary">{rep.reportCode}</td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-on-surface">{rep.patientName}</p>
                      <p className="font-mono text-[11px] text-on-surface-variant">{rep.patientCode}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-on-surface">{rep.doctorName}</p>
                      <p className="text-on-surface-variant text-[11px]">{rep.departmentName}</p>
                    </td>
                    <td className="py-4 px-6 font-semibold text-on-surface">{rep.reportType}</td>
                    <td className="py-4 px-6 font-mono text-[11px] text-on-surface-variant">{rep.reportDate}</td>
                    <td className="py-4 px-6 text-on-surface truncate max-w-xs">{rep.diagnosis || 'Completed'}</td>
                    <td className="py-4 px-6">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {rep.status || 'Final'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Publish Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <h3 className="font-headline-md text-headline-md text-on-surface">Publish Clinical Medical Report</h3>
              <button onClick={() => setModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Patient *
                  </label>
                  <select
                    value={form.patientId}
                    onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName} ({p.patientCode})</option>
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
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.fullName} ({d.specialization})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Report Type / Test Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.reportType}
                    onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                    placeholder="e.g. 12-Lead ECG, Complete Blood Count, 3T MRI Brain..."
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.departmentName}
                    onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                    placeholder="e.g. Pathology & Diagnostics"
                    className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Diagnostic Impression / Result Summary *
                </label>
                <input
                  type="text"
                  required
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  placeholder="e.g. Sinus rhythm, borderline LVH, no acute ischemic change"
                  className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Detailed Laboratory Findings / Biomarkers
                </label>
                <textarea
                  rows="3"
                  value={form.testResults}
                  onChange={(e) => setForm({ ...form, testResults: e.target.value })}
                  placeholder="WBC: 7.2 x 10^3/uL, Hemoglobin: 14.5 g/dL..."
                  className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Doctor Recommendation & Notes
                </label>
                <textarea
                  rows="2"
                  value={form.doctorNotes}
                  onChange={(e) => setForm({ ...form, doctorNotes: e.target.value })}
                  placeholder="Advised to continue current medications..."
                  className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReportsAdmin;
