import React, { useState, useEffect } from 'react';
import { emergencyApi } from '../../services/api';
import { EMERGENCY_CONTACTS } from '../../config/emergencyConfig';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

const EmergencyManagement = () => {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filters (Server-side)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterEmergencyType, setFilterEmergencyType] = useState('ALL');
  const [filterContactMethod, setFilterContactMethod] = useState('ALL');

  // Details & Status update modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Status update form
  const [statusForm, setStatusForm] = useState({
    status: 'ACKNOWLEDGED',
    notes: '',
  });

  const fetchEmergencyData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (filterEmergencyType !== 'ALL') params.emergencyType = filterEmergencyType;
      if (filterContactMethod !== 'ALL') params.contactMethod = filterContactMethod;

      const [requestsRes, statsRes] = await Promise.all([
        emergencyApi.getAll(params),
        emergencyApi.getStats(),
      ]);

      setRequests(requestsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Error fetching emergency data:', err);
      addToast('Failed to load emergency data from MySQL database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyData();
    // Auto polling every 20 seconds for emergency triage monitoring
    const interval = setInterval(fetchEmergencyData, 20000);
    return () => clearInterval(interval);
  }, [filterStatus, filterEmergencyType, filterContactMethod]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmergencyData();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setFilterEmergencyType('ALL');
    setFilterContactMethod('ALL');
  };

  const handleOpenDetails = (req) => {
    setSelectedRequest(req);
    setDetailsModalOpen(true);
  };

  const handleOpenUpdate = (req) => {
    setSelectedRequest(req);
    setStatusForm({
      status: req.status === 'REQUESTED' ? 'ACKNOWLEDGED' : req.status,
      notes: '',
    });
    setUpdateModalOpen(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSubmittingUpdate(true);
    try {
      const res = await emergencyApi.updateStatus(selectedRequest.id, statusForm);
      addToast(`Emergency ${res.data.requestCode} status updated to ${res.data.status} in MySQL`, 'success');
      setUpdateModalOpen(false);
      if (detailsModalOpen) {
        setSelectedRequest(res.data);
      } else {
        setSelectedRequest(null);
      }
      fetchEmergencyData();
    } catch (err) {
      console.error('Error updating emergency status:', err);
      addToast(err?.response?.data?.message || 'Failed to update emergency status in database', 'error');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const getStatusBadgeType = (status) => {
    switch (status) {
      case 'ACKNOWLEDGED':
      case 'IN_PROGRESS':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      case 'CANCELLED':
        return 'neutral';
      case 'HOSPITAL_CONTACTED':
      case 'AMBULANCE_CONTACTED':
      case 'REQUESTED':
      default:
        return 'danger';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 text-white backdrop-blur-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>Hospital Trauma Center & Dispatch Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Emergency Management & Triage Center
          </h1>
          <p className="text-xs text-rose-100 max-w-xl">
            Live MySQL records of emergency alerts, hospital calls, ambulance requests, patient locations, and triage response logs.
          </p>
        </div>

        <button
          onClick={fetchEmergencyData}
          className="bg-white text-rose-700 font-extrabold text-xs px-4 py-3 rounded-2xl hover:bg-rose-50 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Refresh Database Feed</span>
        </button>
      </div>

      {/* Real-time Statistics Cards (Direct from MySQL) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
              Total Requests
            </span>
            <span className="material-symbols-outlined text-primary text-xl">dataset</span>
          </div>
          <p className="text-3xl font-black text-on-surface">
            {stats ? stats.totalRequests : 'â€”'}
          </p>
          <p className="text-[11px] text-outline">Permanent MySQL emergency records</p>
        </div>

        <div className="bg-surface-container-lowest border border-rose-300 rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
              Active Emergencies
            </span>
            <span className="material-symbols-outlined text-rose-600 text-xl animate-pulse">crisis_alert</span>
          </div>
          <p className="text-3xl font-black text-rose-700">
            {stats ? stats.activeEmergencies : 'â€”'}
          </p>
          <p className="text-[11px] text-rose-600/80">Pending triage / in progress</p>
        </div>

        <div className="bg-surface-container-lowest border border-amber-300 rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
              Ambulance Calls
            </span>
            <span className="material-symbols-outlined text-amber-700 text-xl">ambulance</span>
          </div>
          <p className="text-3xl font-black text-amber-800">
            {stats ? stats.ambulanceContacts : 'â€”'}
          </p>
          <p className="text-[11px] text-amber-700/80">Dispatched or caller contacted</p>
        </div>

        <div className="bg-surface-container-lowest border border-emerald-300 rounded-2xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
              Resolved Cases
            </span>
            <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
          </div>
          <p className="text-3xl font-black text-emerald-700">
            {stats ? stats.resolvedEmergencies : 'â€”'}
          </p>
          <p className="text-[11px] text-emerald-700/80">Admitted or completed triage</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Request ID, Patient name, Phone number, Emergency type..."
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface font-semibold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUESTED">REQUESTED</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="HOSPITAL_CONTACTED">HOSPITAL_CONTACTED</option>
              <option value="AMBULANCE_CONTACTED">AMBULANCE_CONTACTED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <select
              value={filterEmergencyType}
              onChange={(e) => setFilterEmergencyType(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface font-semibold focus:outline-none"
            >
              <option value="ALL">All Emergency Types</option>
              <option value="Accident">Accident</option>
              <option value="Severe Chest Pain">Severe Chest Pain</option>
              <option value="Breathing Difficulty">Breathing Difficulty</option>
              <option value="Severe Bleeding">Severe Bleeding</option>
              <option value="Unconscious Person">Unconscious Person</option>
              <option value="Stroke Symptoms">Stroke Symptoms</option>
              <option value="Severe Burn / Chemical">Severe Burn / Chemical</option>
              <option value="Other Acute Emergency">Other Acute Emergency</option>
            </select>

            <select
              value={filterContactMethod}
              onChange={(e) => setFilterContactMethod(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface font-semibold focus:outline-none"
            >
              <option value="ALL">All Contact Methods</option>
              <option value="HOSPITAL_EMERGENCY">Hospital Call</option>
              <option value="AMBULANCE">Ambulance Call</option>
              <option value="MANUAL_REQUEST">Manual Request</option>
            </select>

            <button
              type="submit"
              className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-xs"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-surface-container-high text-on-surface-variant font-bold text-xs px-3 py-2.5 rounded-xl hover:bg-surface-container-highest transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Emergency Records Table Feed */}
      <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60 mb-4">
          <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">
            Active Emergency Queue ({requests.length} Records)
          </h2>
          <span className="text-xs text-outline">MySQL Table: emergency_requests</span>
        </div>

        {loading ? (
          <Loader message="Loading real-time emergency records from MySQL..." />
        ) : requests.length === 0 ? (
          <div className="py-14 text-center text-on-surface-variant/70 space-y-2">
            <span className="material-symbols-outlined text-4xl text-outline">verified</span>
            <p className="text-xs font-bold">No emergency requests match current filter.</p>
            <p className="text-[11px] text-outline">All acute requests have been handled or cleared.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-on-surface">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-extrabold tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Emergency</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 font-medium">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-container-low/40 transition-colors">
                    {/* Request ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {req.requestCode}
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      {req.patientNameSnapshot || req.patientName}
                      {req.patientCode && (
                        <span className="block text-[10px] text-outline font-normal">
                          {req.patientCode}
                        </span>
                      )}
                    </td>

                    {/* Emergency Type */}
                    <td className="py-3.5 px-4 font-semibold text-rose-700 dark:text-rose-400">
                      {req.emergencyType}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-on-surface-variant max-w-xs truncate" title={req.description}>
                      {req.description || 'No description provided'}
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-on-surface-variant text-[11px]">
                      {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Recent'}
                    </td>

                    {/* Contact & Initiated Call */}
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      <a
                        href={`tel:${req.patientPhoneSnapshot || req.contactNumber}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">call</span>
                        <span>{req.patientPhoneSnapshot || req.contactNumber}</span>
                      </a>
                      <div className="mt-0.5 space-y-0.5 text-[10px] font-sans">
                        {req.emergencyCallInitiatedAt && (
                          <span className="inline-block text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                            Hospital Call: Initiated
                          </span>
                        )}
                        {req.ambulanceCallInitiatedAt && (
                          <span className="inline-block text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                            Ambulance Call: Initiated
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} type={getStatusBadgeType(req.status)} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetails(req)}
                        className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-[11px] px-2.5 py-1.5 rounded-xl transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleOpenUpdate(req)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Admin Emergency Modal (Requirement 35) */}
      {detailsModalOpen && selectedRequest && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={`Emergency Request: ${selectedRequest.requestCode}`}
        >
          <div className="space-y-4 text-xs text-on-surface">
            <div className="bg-surface-container-low p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3.5 border border-outline-variant/60">
              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Emergency Request Code</p>
                <p className="font-mono text-base font-black text-primary">{selectedRequest.requestCode}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Current Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedRequest.status} type={getStatusBadgeType(selectedRequest.status)} />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Patient</p>
                <p className="font-extrabold text-sm text-on-surface">
                  {selectedRequest.patientNameSnapshot || selectedRequest.patientName}
                </p>
                {selectedRequest.patientCode && (
                  <p className="text-[11px] text-outline">Patient ID: {selectedRequest.patientCode}</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Patient Phone</p>
                <a
                  href={`tel:${selectedRequest.patientPhoneSnapshot || selectedRequest.contactNumber}`}
                  className="font-mono text-sm font-bold text-primary hover:underline flex items-center gap-1 mt-0.5"
                >
                  <span className="material-symbols-outlined text-sm">call</span>
                  <span>{selectedRequest.patientPhoneSnapshot || selectedRequest.contactNumber}</span>
                </a>
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Emergency Type</p>
                <p className="font-bold text-rose-600 dark:text-rose-400">{selectedRequest.emergencyType}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">People Affected</p>
                <p className="font-semibold">{selectedRequest.peopleAffected || selectedRequest.numberOfPeople || 1}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Reported Location</p>
                <p className="font-semibold text-on-surface">{selectedRequest.location || 'Verbal on phone'}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Description</p>
                <p className="text-on-surface-variant bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/40 mt-1 whitespace-pre-wrap">
                  {selectedRequest.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Requested At</p>
                <p className="font-medium text-on-surface-variant">
                  {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Updated At</p>
                <p className="font-medium text-on-surface-variant">
                  {selectedRequest.updatedAt ? new Date(selectedRequest.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Hospital Emergency Call</p>
                <p className="font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                  {selectedRequest.emergencyCallInitiatedAt ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Initiated ({new Date(selectedRequest.emergencyCallInitiatedAt).toLocaleTimeString()})</span>
                    </span>
                  ) : (
                    <span className="text-outline">Not initiated</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase">Ambulance Call</p>
                <p className="font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                  {selectedRequest.ambulanceCallInitiatedAt ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Initiated ({new Date(selectedRequest.ambulanceCallInitiatedAt).toLocaleTimeString()})</span>
                    </span>
                  ) : (
                    <span className="text-outline">Not initiated</span>
                  )}
                </p>
              </div>

              {selectedRequest.notes && (
                <div className="sm:col-span-2 pt-2 border-t border-outline-variant/60">
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase">Staff & Clinical Notes</p>
                  <pre className="text-[11px] font-sans bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/40 mt-1 whitespace-pre-wrap">
                    {selectedRequest.notes}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="text-xs font-semibold text-on-surface-variant px-4 py-2 rounded-xl hover:bg-surface-container-high"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleOpenUpdate(selectedRequest);
                }}
                className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container transition-colors shadow-xs"
              >
                Update Status
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Update Modal */}
      {updateModalOpen && selectedRequest && (
        <Modal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          title={`Update Emergency Status: ${selectedRequest.requestCode}`}
        >
          <form onSubmit={handleSaveStatus} className="space-y-4">
            <div className="bg-surface-container-low p-4 rounded-2xl space-y-1.5 text-xs text-on-surface">
              <p><strong>Patient / Caller:</strong> {selectedRequest.patientNameSnapshot || selectedRequest.patientName}</p>
              <p><strong>Emergency:</strong> {selectedRequest.emergencyType}</p>
              <p><strong>Current Status:</strong> <span className="font-bold">{selectedRequest.status}</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                New Emergency Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="REQUESTED">REQUESTED</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED (Triage Team Alerted)</option>
                <option value="HOSPITAL_CONTACTED">HOSPITAL_CONTACTED (Hospital Call in Progress)</option>
                <option value="AMBULANCE_CONTACTED">AMBULANCE_CONTACTED (Ambulance Call in Progress)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Ambulance Dispatched / Patient in ER)</option>
                <option value="RESOLVED">RESOLVED (Admitted / Stabilized / Handled)</option>
                <option value="CANCELLED">CANCELLED (False Alarm / Test)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Staff / Dispatch Notes
              </label>
              <textarea
                rows="3"
                value={statusForm.notes}
                onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                placeholder="e.g. Paramedic Team 2 dispatched; patient located at Gate 1; expected arrival 5 mins..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="text-xs font-semibold text-on-surface-variant px-4 py-2 rounded-xl hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingUpdate}
                className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>{submittingUpdate ? 'Saving to Database...' : 'Persist Status Update'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default EmergencyManagement;