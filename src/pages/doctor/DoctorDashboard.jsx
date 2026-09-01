import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doctorPortalApi } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await doctorPortalApi.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Error fetching doctor dashboard:', err);
      setError(err?.response?.data?.message || 'Failed to load doctor dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader message="Loading clinical schedule..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const doctor = data?.doctor;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/10 via-surface-container-low to-surface-container-lowest border border-purple-200/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <span className="material-symbols-outlined text-sm">stethoscope</span>
            Doctor ID: {doctor?.doctorCode || 'DOC-2001'} • {doctor?.departmentName || doctor?.specialization}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            Good day, {doctor?.fullName || user?.fullName || 'Doctor'}
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xl">
            Review today's consultation schedule, access assigned clinical patients, and issue electronic prescriptions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/prescriptions"
            className="bg-purple-700 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-purple-800 transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">prescriptions</span>
            <span>Write Prescription</span>
          </Link>
          <Link
            to="/doctor/appointments"
            className="bg-surface-container-lowest border border-outline-variant hover:border-primary/40 text-on-surface font-semibold text-xs px-4 py-3 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-lg text-primary">event_available</span>
            <span>My Schedule</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
          <span className="material-symbols-outlined text-purple-700 text-2xl">event_available</span>
          <p className="text-2xl font-extrabold text-on-surface">{data?.todayAppointmentsCount ?? 0}</p>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Today's Appointments</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
          <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
          <p className="text-2xl font-extrabold text-primary">{data?.upcomingAppointmentsCount ?? 0}</p>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Upcoming Schedule</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
          <span className="material-symbols-outlined text-emerald-600 text-2xl">group</span>
          <p className="text-2xl font-extrabold text-emerald-700">{data?.totalPatientsAssigned ?? 0}</p>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Clinical Patients</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
          <span className="material-symbols-outlined text-amber-600 text-2xl">check_circle</span>
          <p className="text-2xl font-extrabold text-amber-700">{data?.completedAppointmentsCount ?? 0}</p>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Completed Consultations</p>
        </div>
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-surface-variant bg-surface-container-low/30 flex items-center justify-between">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Today's Patient Queue</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Consultations scheduled for today</p>
          </div>
          <Link to="/doctor/appointments" className="text-primary text-xs font-bold hover:underline">
            View All Schedule &rarr;
          </Link>
        </div>

        {(!data?.todayAppointments || data.todayAppointments.length === 0) ? (
          <div className="p-8 text-center text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-3xl text-outline mb-1">event_available</span>
            <p>No more consultations scheduled for today.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-variant">
            {data.todayAppointments.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-surface transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-xs">
                    {(apt.patientName || 'P').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-on-surface">{apt.patientName}</p>
                      <span className="font-mono text-[11px] text-on-surface-variant">({apt.patientCode})</span>
                      <StatusBadge status={apt.status} size="xs" />
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      ⏰ <strong>{apt.appointmentTime}</strong> • Reason: {apt.reason || 'General Consultation'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/prescriptions"
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Prescribe
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
