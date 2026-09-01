import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { patientPortalApi } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientPortalApi.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Error fetching patient dashboard:', err);
      setError(err?.response?.data?.message || 'Failed to load patient portal dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader message="Loading your health portal..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const patient = data?.patient;
  const nextApt = data?.nextAppointment;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-surface-container-low to-surface-container-lowest border border-primary/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-sm">badge</span>
            Patient ID: {patient?.patientCode || 'PT-1001'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            Welcome back, {patient?.fullName || user?.fullName || 'Patient'}
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xl">
            View your upcoming clinical consultations, review doctor prescriptions, monitor lab reports, and manage hospital invoices.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/patient/book-appointment"
            className="bg-primary text-on-primary font-bold text-xs px-5 py-3 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Book Appointment</span>
          </Link>
          <Link
            to="/patient/beds"
            className="bg-surface-container-lowest border border-outline-variant hover:border-primary/40 text-on-surface font-semibold text-xs px-4 py-3 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-lg text-primary">hotel</span>
            <span>Bed Request</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm space-y-1">
          <span className="material-symbols-outlined text-primary text-xl">event_available</span>
          <p className="text-2xl font-extrabold text-on-surface">{data?.totalAppointments ?? 0}</p>
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Appointments</p>
        </div>

        <div className="bg-surface-container-lowest border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-1 bg-emerald-50/20">
          <span className="material-symbols-outlined text-emerald-600 text-xl">schedule</span>
          <p className="text-2xl font-extrabold text-emerald-700">{data?.upcomingAppointments ?? 0}</p>
          <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Upcoming</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm space-y-1">
          <span className="material-symbols-outlined text-purple-600 text-xl">task_alt</span>
          <p className="text-2xl font-extrabold text-purple-700">{data?.completedAppointments ?? 0}</p>
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Completed</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm space-y-1">
          <span className="material-symbols-outlined text-indigo-600 text-xl">prescriptions</span>
          <p className="text-2xl font-extrabold text-indigo-700">{data?.totalPrescriptions ?? 0}</p>
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Prescriptions</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm space-y-1">
          <span className="material-symbols-outlined text-sky-600 text-xl">description</span>
          <p className="text-2xl font-extrabold text-sky-700">{data?.totalReports ?? 0}</p>
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Lab Reports</p>
        </div>

        <div className="bg-surface-container-lowest border border-amber-200 rounded-2xl p-4 shadow-sm space-y-1 bg-amber-50/20">
          <span className="material-symbols-outlined text-amber-600 text-xl">receipt_long</span>
          <p className="text-2xl font-extrabold text-amber-700">{data?.pendingBills ?? 0}</p>
          <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">Pending Bills</p>
        </div>
      </div>

      {/* Next Appointment Spotlight */}
      {nextApt && (
        <div className="bg-surface-container-lowest border-2 border-primary/40 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-extrabold flex flex-col items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">event</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Your Next Consultation</span>
                <StatusBadge status={nextApt.status} size="xs" />
              </div>
              <h3 className="font-bold text-base text-on-surface mt-0.5">
                {nextApt.doctorName || nextApt.doctor?.fullName || 'Consulting Specialist'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                📅 <strong>{nextApt.appointmentDate}</strong> at <strong>{nextApt.appointmentTime}</strong> • {nextApt.reason || 'General Follow-up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/patient/appointments"
              className="bg-surface border border-outline-variant hover:border-primary/40 text-on-surface font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
            >
              View Appointment &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Prescriptions & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prescriptions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-surface-variant bg-surface-container-low/30 flex items-center justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Recent Prescriptions</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Medications issued by attending doctors</p>
            </div>
            <Link to="/patient/prescriptions" className="text-primary text-xs font-bold hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-surface-variant flex-1">
            {(!data?.recentPrescriptions || data.recentPrescriptions.length === 0) ? (
              <div className="p-8 text-center text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-3xl text-outline mb-1">prescriptions</span>
                <p>No prescriptions recorded yet.</p>
              </div>
            ) : (
              data.recentPrescriptions.map((rx) => (
                <div key={rx.id} className="p-4 hover:bg-surface transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{rx.prescriptionCode}</span>
                      <span className="text-[11px] text-on-surface-variant">• {rx.prescriptionDate}</span>
                    </div>
                    <p className="text-xs font-semibold text-on-surface">{rx.diagnosis || 'Clinical Consultation'}</p>
                    <p className="text-[11px] text-on-surface-variant">Doctor: {rx.doctorName || 'Attending Physician'}</p>
                  </div>
                  <Link
                    to={`/patient/prescriptions`}
                    className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    View Meds
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-surface-variant bg-surface-container-low/30 flex items-center justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Medical & Diagnostic Reports</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Laboratory and imaging results</p>
            </div>
            <Link to="/patient/reports" className="text-primary text-xs font-bold hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-surface-variant flex-1">
            {(!data?.recentReports || data.recentReports.length === 0) ? (
              <div className="p-8 text-center text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-3xl text-outline mb-1">description</span>
                <p>No lab or diagnostic reports available.</p>
              </div>
            ) : (
              data.recentReports.map((rep) => (
                <div key={rep.id} className="p-4 hover:bg-surface transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">{rep.reportCode}</span>
                      <span className="text-[11px] text-on-surface-variant">• {rep.reportDate}</span>
                    </div>
                    <p className="text-xs font-semibold text-on-surface">{rep.reportType}</p>
                    <p className="text-[11px] text-on-surface-variant">{rep.diagnosis || 'Standard diagnostic test'}</p>
                  </div>
                  <Link
                    to={`/patient/reports`}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    View Report
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
