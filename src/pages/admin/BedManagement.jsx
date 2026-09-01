import React, { useState, useEffect } from 'react';
import { bedApi, departmentApi, patientApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const BedManagement = () => {
  const [activeTab, setActiveTab] = useState('BEDS'); // 'BEDS' | 'RESERVATIONS'
  const [beds, setBeds] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit Bed Modal
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [bedForm, setBedForm] = useState({
    bedNumber: '',
    departmentId: '',
    bedType: 'GENERAL',
    dailyCharge: '100.00',
    status: 'AVAILABLE',
    notes: '',
  });
  const [savingBed, setSavingBed] = useState(false);

  // Status Change State
  const [statusModalBed, setStatusModalBed] = useState(null);
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  const [occupantPatientId, setOccupantPatientId] = useState('');

  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, rRes, depRes, pRes] = await Promise.allSettled([
        bedApi.getAllBeds(),
        bedApi.getAllReservations(),
        departmentApi.getAll(),
        patientApi.getAll(),
      ]);

      if (bRes.status === 'fulfilled') setBeds(bRes.value.data || []);
      if (rRes.status === 'fulfilled') setReservations(rRes.value.data || []);
      if (depRes.status === 'fulfilled') {
        const deps = depRes.value.data || [];
        setDepartments(deps);
        if (deps.length > 0 && !bedForm.departmentId) {
          setBedForm((prev) => ({ ...prev, departmentId: deps[0].id }));
        }
      }
      if (pRes.status === 'fulfilled') setPatients(pRes.value.data || []);
    } catch (err) {
      console.error('Error fetching bed management data:', err);
      toast.error('Failed to load beds and reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBed = async (e) => {
    e.preventDefault();
    setSavingBed(true);
    try {
      await bedApi.createBed(bedForm);
      toast.success(`Bed ${bedForm.bedNumber} added successfully.`);
      setBedModalOpen(false);
      setBedForm({
        bedNumber: '',
        departmentId: departments[0]?.id || '',
        bedType: 'GENERAL',
        dailyCharge: '100.00',
        status: 'AVAILABLE',
        notes: '',
      });
      fetchData();
    } catch (err) {
      console.error('Create bed error:', err);
      toast.error(err?.response?.data?.message || 'Failed to create bed.');
    } finally {
      setSavingBed(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalBed) return;

    try {
      const patientId = newStatus === 'OCCUPIED' && occupantPatientId ? Number(occupantPatientId) : null;
      await bedApi.updateBedStatus(statusModalBed.id, newStatus, patientId);
      toast.success(`Bed status updated to ${newStatus}`);
      setStatusModalBed(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update bed status.');
    }
  };

  const handleReservationAction = async (resId, newStatus) => {
    try {
      await bedApi.updateReservationStatus(resId, newStatus, `Updated by staff to ${newStatus}`);
      toast.success(`Reservation marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update reservation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Bed & ICU Ward Allocation</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Monitor real-time bed occupancy, allocate inpatient admissions, and process patient bed requests.
          </p>
        </div>

        <button
          onClick={() => setBedModalOpen(true)}
          className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Add New Bed Unit</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-surface-container-high p-1 rounded-2xl flex gap-1 border border-outline-variant max-w-md shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('BEDS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'BEDS'
              ? 'bg-surface-container-lowest text-on-surface shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Hospital Beds ({beds.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RESERVATIONS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'RESERVATIONS'
              ? 'bg-surface-container-lowest text-on-surface shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Admission Requests ({reservations.length})
        </button>
      </div>

      {loading ? (
        <Loader message="Loading bed infrastructure..." />
      ) : activeTab === 'BEDS' ? (
        /* Beds Table */
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                <tr>
                  <th className="py-3.5 px-6">Bed Number</th>
                  <th className="py-3.5 px-6">Type & Wing</th>
                  <th className="py-3.5 px-6">Daily Rate</th>
                  <th className="py-3.5 px-6">Current Occupant</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {beds.map((b) => (
                  <tr key={b.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6 font-mono font-extrabold text-primary text-sm">{b.bedNumber}</td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-on-surface">{b.bedType}</p>
                      <p className="text-on-surface-variant text-[11px]">{b.departmentName || 'General Wing'}</p>
                    </td>
                    <td className="py-4 px-6 font-bold text-on-surface">${Number(b.dailyCharge || 0).toFixed(2)}</td>
                    <td className="py-4 px-6">
                      {b.patientName ? (
                        <div>
                          <p className="font-bold text-on-surface">{b.patientName}</p>
                          <p className="font-mono text-[11px] text-on-surface-variant">{b.patientCode}</p>
                        </div>
                      ) : (
                        <span className="text-outline text-xs italic">Unoccupied</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={b.status} size="xs" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setStatusModalBed(b);
                          setNewStatus(b.status || 'AVAILABLE');
                          setOccupantPatientId(b.currentPatientId ? String(b.currentPatientId) : '');
                        }}
                        className="bg-surface border border-outline-variant hover:border-primary/40 text-on-surface text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Change Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Reservations Table */
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          {reservations.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="hotel"
                title="No Pending Bed Requests"
                description="All patient admission reservation requests have been processed."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                  <tr>
                    <th className="py-3.5 px-6">Request Code</th>
                    <th className="py-3.5 px-6">Patient</th>
                    <th className="py-3.5 px-6">Requested Bed / Wing</th>
                    <th className="py-3.5 px-6">Admission Date</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Staff Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-surface transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-primary">{r.reservationCode}</td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-on-surface">{r.patientName}</p>
                        <p className="font-mono text-[11px] text-on-surface-variant">{r.patientCode}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-on-surface">{r.bedType}</p>
                        <p className="text-on-surface-variant text-[11px]">{r.departmentName}</p>
                      </td>
                      <td className="py-4 px-6 font-semibold text-on-surface">📅 {r.admissionDate}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={r.status} size="xs" />
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleReservationAction(r.id, 'CONFIRMED')}
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-lg text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReservationAction(r.id, 'CANCELLED')}
                              className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-2.5 py-1 rounded-lg text-xs"
                            >
                              Reject
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
      )}

      {/* Add Bed Modal */}
      {bedModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-2">
              <h3 className="font-headline-md text-headline-md text-on-surface">Add Hospital Bed Unit</h3>
              <button onClick={() => setBedModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBed} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Bed Identifier / Number *
                </label>
                <input
                  type="text"
                  required
                  value={bedForm.bedNumber}
                  onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                  placeholder="e.g. ICU-111 or GW-216"
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Department Wing *
                  </label>
                  <select
                    value={bedForm.departmentId}
                    onChange={(e) => setBedForm({ ...bedForm, departmentId: e.target.value })}
                    className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Bed Type *
                  </label>
                  <select
                    value={bedForm.bedType}
                    onChange={(e) => setBedForm({ ...bedForm, bedType: e.target.value })}
                    className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="ICU">ICU</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="SEMI_PRIVATE">SEMI_PRIVATE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Daily Charge ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={bedForm.dailyCharge}
                  onChange={(e) => setBedForm({ ...bedForm, dailyCharge: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-bold text-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBedModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBed}
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container disabled:opacity-50"
                >
                  {savingBed ? 'Saving...' : 'Add Bed Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {statusModalBed && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-2">
              <h3 className="font-bold text-sm text-on-surface">
                Update Status: Bed {statusModalBed.bedNumber}
              </h3>
              <button onClick={() => setStatusModalBed(null)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Bed Operational Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface"
                >
                  <option value="AVAILABLE">AVAILABLE (Vacant)</option>
                  <option value="OCCUPIED">OCCUPIED (Admitted)</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="MAINTENANCE">MAINTENANCE (Cleaning)</option>
                </select>
              </div>

              {newStatus === 'OCCUPIED' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Admitted Patient
                  </label>
                  <select
                    value={occupantPatientId}
                    onChange={(e) => setOccupantPatientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.patientCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModalBed(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:bg-primary-container"
                >
                  Update Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagement;
