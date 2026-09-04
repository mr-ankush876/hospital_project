import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userManagementApi, patientApi, appointmentApi, billApi, emergencyApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Recent';
  }
};

const ReceptionistDesk = () => {
  const [receptionists, setReceptionists] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({
    receptionistCount: 0,
    patientCount: 0,
    appointmentCount: 0,
    billCount: 0,
    emergencyCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const fetchDeskData = async () => {
    setLoading(true);
    try {
      const [uRes, pRes, aRes, bRes, eRes, logRes] = await Promise.allSettled([
        userManagementApi.getAllUsers({ role: 'RECEPTIONIST' }),
        patientApi.getAll({ limit: 10 }),
        appointmentApi.getAll({ limit: 10 }),
        billApi.getAll({ limit: 10 }),
        emergencyApi.getAll({ limit: 10 }),
        userManagementApi.getAuditLogs({ role: 'RECEPTIONIST' }),
      ]);

      const recepList = uRes.status === 'fulfilled' ? (uRes.value.data || []) : [];
      setReceptionists(recepList);

      const patList = pRes.status === 'fulfilled' ? (Array.isArray(pRes.value.data) ? pRes.value.data : pRes.value.data?.content || []) : [];
      const aptList = aRes.status === 'fulfilled' ? (Array.isArray(aRes.value.data) ? aRes.value.data : aRes.value.data?.content || []) : [];
      const billList = bRes.status === 'fulfilled' ? (Array.isArray(bRes.value.data) ? bRes.value.data : bRes.value.data?.content || []) : [];
      const emgList = eRes.status === 'fulfilled' ? (Array.isArray(eRes.value.data) ? eRes.value.data : eRes.value.data?.content || []) : [];
      const logsList = logRes.status === 'fulfilled' ? (logRes.value.data || []) : [];

      setAuditLogs(logsList);

      setStats({
        receptionistCount: recepList.length,
        patientCount: patList.length,
        appointmentCount: aptList.length,
        billCount: billList.length,
        emergencyCount: emgList.length,
      });
    } catch (err) {
      console.error('Error fetching Receptionist Desk data:', err);
      toast.error('Failed to load Receptionist Operations data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeskData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Receptionist Operations & Audit Desk</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Centralized monitoring of all receptionist activities, patient registrations, appointments, and billing operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Add Receptionist Staff</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">badge</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Active Staff</p>
            <p className="text-lg font-extrabold text-on-surface">{stats.receptionistCount} Receptionists</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Patients Registered</p>
            <p className="text-lg font-extrabold text-on-surface">{stats.patientCount} Records</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">event_available</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Appointments Scheduled</p>
            <p className="text-lg font-extrabold text-on-surface">{stats.appointmentCount} Consultations</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 font-bold flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">payments</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Invoices Handled</p>
            <p className="text-lg font-extrabold text-on-surface">{stats.billCount} Bills</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 font-bold flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">emergency</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Emergency Dispatches</p>
            <p className="text-lg font-extrabold text-on-surface">{stats.emergencyCount} Requests</p>
          </div>
        </div>
      </div>

      {/* Quick Action Receptionist Buttons */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Receptionist Operations Desk Controls</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/patients"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant hover:border-primary/40 bg-surface hover:bg-surface-container-low transition-all group"
          >
            <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">person_add</span>
            <div>
              <p className="text-xs font-bold text-on-surface">Patient Registration Desk</p>
              <p className="text-[11px] text-on-surface-variant">Add & manage patient files</p>
            </div>
          </Link>

          <Link
            to="/appointments"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant hover:border-emerald-500/40 bg-surface hover:bg-surface-container-low transition-all group"
          >
            <span className="material-symbols-outlined text-emerald-700 text-2xl group-hover:scale-110 transition-transform">event_available</span>
            <div>
              <p className="text-xs font-bold text-on-surface">Appointment Counter</p>
              <p className="text-[11px] text-on-surface-variant">Schedule doctor slots</p>
            </div>
          </Link>

          <Link
            to="/admin/beds"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant hover:border-teal-500/40 bg-surface hover:bg-surface-container-low transition-all group"
          >
            <span className="material-symbols-outlined text-teal-700 text-2xl group-hover:scale-110 transition-transform">hotel</span>
            <div>
              <p className="text-xs font-bold text-on-surface">Bed & ICU Allocation Desk</p>
              <p className="text-[11px] text-on-surface-variant">Confirm & allocate beds</p>
            </div>
          </Link>

          <Link
            to="/billing"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant hover:border-amber-500/40 bg-surface hover:bg-surface-container-low transition-all group"
          >
            <span className="material-symbols-outlined text-amber-700 text-2xl group-hover:scale-110 transition-transform">receipt_long</span>
            <div>
              <p className="text-xs font-bold text-on-surface">Billing & Payments Counter</p>
              <p className="text-[11px] text-on-surface-variant">Issue receipts & settle bills</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Receptionist Staff Directory & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receptionist Staff Directory */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-surface-variant bg-surface-container-low/30">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Receptionist Staff Roster</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Active receptionists with full login credentials</p>
            </div>
            <Link to="/admin/users" className="text-primary text-xs font-bold hover:underline">
              Manage Accounts &rarr;
            </Link>
          </div>

          <div className="divide-y divide-surface-variant flex-1 overflow-y-auto max-h-[400px]">
            {loading ? (
              <div className="p-8 text-center"><Loader message="Loading receptionist staff..." /></div>
            ) : receptionists.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-3xl text-outline mb-1">badge</span>
                <p>No receptionists currently provisioned in database.</p>
                <Link to="/admin/users" className="text-xs text-primary font-bold mt-2 inline-block hover:underline">
                  Create Receptionist Account
                </Link>
              </div>
            ) : (
              receptionists.map((rec) => (
                <div key={rec.id} className="p-4 hover:bg-surface transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {(rec.fullName || rec.username).substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">{rec.fullName || rec.username}</p>
                      <p className="text-xs text-on-surface-variant font-mono">@{rec.username} • {rec.phone || rec.email}</p>
                      <p className="text-[11px] text-outline mt-0.5">Last Active: {formatDateTime(rec.lastLoginAt)}</p>
                    </div>
                  </div>
                  <StatusBadge status={rec.status} size="xs" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Receptionist Action Trail */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-surface-variant bg-surface-container-low/30">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Receptionist Activity Trail</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Real-time actions recorded from receptionist desk</p>
            </div>
            <Link to="/admin/audit-logs" className="text-primary text-xs font-bold hover:underline">
              Full Audit Logs &rarr;
            </Link>
          </div>

          <div className="divide-y divide-surface-variant flex-1 overflow-y-auto max-h-[400px]">
            {loading ? (
              <div className="p-8 text-center"><Loader message="Loading activity trail..." /></div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-3xl text-outline mb-1">history</span>
                <p>No receptionist actions logged yet.</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-surface transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-primary font-mono">@{log.username}</span>
                    <span className="text-[11px] text-outline font-mono">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <p className="text-xs font-semibold text-on-surface">{log.action}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDesk;
