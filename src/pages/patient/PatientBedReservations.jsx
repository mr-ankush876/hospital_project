import React, { useState, useEffect } from 'react';
import { patientPortalApi, publicApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const PatientBedReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [bedStats, setBedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    departmentId: '',
    bedType: 'GENERAL',
    admissionDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });

  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, depRes, bRes] = await Promise.allSettled([
        patientPortalApi.getBedReservations(),
        publicApi.getDepartments(),
        publicApi.getBedAvailability(),
      ]);

      if (resRes.status === 'fulfilled') setReservations(resRes.value.data || []);
      if (depRes.status === 'fulfilled') {
        const deps = depRes.value.data || [];
        setDepartments(deps);
        if (deps.length > 0 && !form.departmentId) {
          setForm((prev) => ({ ...prev, departmentId: deps[0].id }));
        }
      }
      if (bRes.status === 'fulfilled') setBedStats(bRes.value.data);
    } catch (err) {
      console.error('Error fetching bed reservations:', err);
      toast.error('Failed to load bed reservation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateReservation = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const payload = {
        departmentId: Number(form.departmentId),
        bedType: form.bedType,
        reservationDate: new Date().toISOString().split('T')[0],
        admissionDate: form.admissionDate,
        reason: form.reason.trim() || 'Inpatient Admission Request',
        notes: form.notes.trim(),
      };

      const res = await patientPortalApi.bookBedReservation(payload);
      toast.success(`Bed reservation request submitted! Code: ${res.data?.reservationCode}`);
      setModalOpen(false);
      setForm({
        departmentId: departments[0]?.id || '',
        bedType: 'GENERAL',
        admissionDate: new Date().toISOString().split('T')[0],
        reason: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      console.error('Bed reservation error:', err);
      toast.error(err?.response?.data?.message || 'Failed to submit bed reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Bed & ICU Reservations</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Submit admission requests, check bed occupancy, and monitor reservation approvals.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Request Bed Reservation</span>
        </button>
      </div>

      {/* Live Availability Quick Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">ICU Beds Available</p>
            <p className="text-2xl font-extrabold text-rose-700">{bedStats?.availableIcuBeds ?? 6}</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-rose-600">vital_signs</span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Emergency Bays</p>
            <p className="text-2xl font-extrabold text-amber-700">{bedStats?.availableEmergencyBeds ?? 6}</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-amber-600">e911_emergency</span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">General Ward Beds</p>
            <p className="text-2xl font-extrabold text-emerald-700">{bedStats?.availableGeneralBeds ?? 11}</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-emerald-600">hotel</span>
        </div>
      </div>

      {/* My Reservations List */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-surface-variant bg-surface-container-low/30">
          <h3 className="font-headline-md text-headline-md text-on-surface">My Bed Reservation Requests</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Status updates reviewed by hospital reception staff</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader message="Loading your bed reservations..." />
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="hotel"
              title="No Bed Reservations"
              description="You have not requested any hospital bed or ICU reservations."
              actionLabel="Request Reservation"
              onAction={() => setModalOpen(true)}
            />
          </div>
        ) : (
          <div className="divide-y divide-surface-variant">
            {reservations.map((r) => (
              <div key={r.id} className="p-5 hover:bg-surface transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{r.reservationCode}</span>
                    <StatusBadge status={r.status} size="xs" />
                  </div>
                  <h4 className="font-bold text-sm text-on-surface">
                    {r.bedType} Bed • Department: {r.departmentName || 'General'}
                  </h4>
                  {r.bedNumber && (
                    <p className="text-xs text-emerald-700 font-bold">
                      Allocated Bed: <strong>{r.bedNumber}</strong>
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant">
                    Reason: <strong>{r.reason || 'Medical Admission'}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs text-on-surface-variant space-y-0.5">
                  <p className="font-semibold text-on-surface">Admission Date: {r.admissionDate}</p>
                  <p>Requested On: {r.reservationDate}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Reservation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">hotel</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Request Bed / ICU Reservation</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Department Wing *
                </label>
                <select
                  required
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.availableBeds ?? 0} Beds Free)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Bed Unit Type *
                  </label>
                  <select
                    value={form.bedType}
                    onChange={(e) => setForm({ ...form, bedType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="GENERAL">General Inpatient Ward</option>
                    <option value="ICU">Intensive Care Unit (ICU)</option>
                    <option value="EMERGENCY">Emergency Acute Bay</option>
                    <option value="PRIVATE">Private Deluxe Suite</option>
                    <option value="SEMI_PRIVATE">Semi-Private Room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Expected Admission Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={form.admissionDate}
                    onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Clinical Admission Reason *
                </label>
                <input
                  type="text"
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Scheduled cardiac bypass, post-op recovery, observation..."
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Special Care Instructions / Notes
                </label>
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Mobility limitations, oxygen requirement, dietary preferences..."
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-surface-variant flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Reservation Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientBedReservations;
