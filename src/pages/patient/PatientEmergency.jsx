import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { emergencyApi } from '../../services/api';
import EmergencyActionCard from '../../components/emergency/EmergencyActionCard';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';

const PatientEmergency = () => {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRequests = async () => {
    try {
      const res = await emergencyApi.getMy();
      setMyRequests(res.data || []);
    } catch (err) {
      console.warn('Could not fetch patient emergency history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleRequestCreated = (newReq) => {
    setMyRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)]);
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
      case 'CALLING_HOSPITAL':
      case 'AMBULANCE_CONTACTED':
      case 'REQUESTED':
      default:
        return 'danger';
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-600/15 via-surface-container-low to-surface-container-lowest border border-rose-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
            <span className="material-symbols-outlined text-sm">emergency</span>
            <span>Patient Immediate Care Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            24/7 Emergency & Ambulance Calling
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
            One-touch priority connection to the VitalSync Trauma Center and Campus Ambulance. Calling initiates immediately via your device phone dialer.
          </p>
        </div>
      </div>

      {/* Emergency Action Card */}
      <EmergencyActionCard
        user={user}
        onRequestCreated={handleRequestCreated}
      />

      {/* Patient Emergency History & Status Tracker */}
      <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-primary">history_toggle_off</span>
              <span>Your Emergency Alerts & Call Records</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Live status tracking of emergency requests logged from your account
            </p>
          </div>
          <button
            onClick={fetchMyRequests}
            className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 px-3 py-1.5 rounded-xl border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <Loader message="Loading your emergency records..." />
        ) : myRequests.length === 0 ? (
          <div className="py-10 text-center text-on-surface-variant/80 space-y-2">
            <span className="material-symbols-outlined text-4xl text-outline">health_and_safety</span>
            <p className="text-xs font-semibold">No emergency requests logged for this account.</p>
            <p className="text-[11px] text-outline">In an emergency, use the calling buttons above immediately.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-on-surface">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-extrabold tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4">Request Code</th>
                  <th className="py-3 px-4">Call Type</th>
                  <th className="py-3 px-4">Emergency Concern</th>
                  <th className="py-3 px-4">Reported Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 font-medium">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-primary">{req.requestCode}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                        <span className="material-symbols-outlined text-xs text-rose-600">
                          {req.contactMethod === 'AMBULANCE' || req.callType === 'AMBULANCE' ? 'ambulance' : 'call'}
                        </span>
                        {req.contactMethod === 'AMBULANCE' || req.callType === 'AMBULANCE' ? 'Ambulance' : 'Hospital Emergency'}
                      </span>
                      <div className="mt-1 space-y-0.5 text-[10px]">
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
                    <td className="py-3.5 px-4">{req.emergencyType}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{req.location || 'Verbal on phone'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} type={getStatusBadgeType(req.status)} />
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant text-[11px]">
                      {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientEmergency;