import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, appointmentApi, patientApi } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import { CardSkeleton } from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const StatCard = ({ icon, label, value, subtext, color, bgColor, onClick }) => (
  <div
    onClick={onClick}
    className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
  >
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <span className={`material-symbols-outlined ${color} text-2xl`}>{icon}</span>
        </div>
        <span className="material-symbols-outlined text-outline text-sm group-hover:text-primary group-hover:translate-x-0.5 transition-all">
          arrow_forward
        </span>
      </div>
      <p className="font-stats-lg text-stats-lg text-on-surface tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">{label}</p>
    </div>
    {subtext && <p className="text-[11px] text-outline mt-2 font-medium">{subtext}</p>}
  </div>
);

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    totalNurses: 0,
    totalStaff: 0,
    totalUsers: 0,
    activeUsers: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalAppointments: 0,
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    reservedBeds: 0,
    totalIcuBeds: 0,
    availableIcuBeds: 0,
    totalEmergencyBeds: 0,
    availableEmergencyBeds: 0,
    totalPrescriptions: 0,
    totalBills: 0,
    pendingBills: 0,
    paidBills: 0,
    totalRevenue: 0,
    emergencyCases: 0,
    medicalReports: 0,
    departments: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, aptsRes, patsRes] = await Promise.all([
        dashboardApi.getStats(),
        appointmentApi.getAll({ limit: 5 }),
        patientApi.getAll({ limit: 5 }),
      ]);

      if (statsRes?.data) {
        setStats((prev) => ({ ...prev, ...statsRes.data }));
      }

      setRecentAppointments(
        Array.isArray(aptsRes?.data) ? aptsRes.data.slice(0, 5) : aptsRes?.data?.content?.slice(0, 5) || []
      );
      setRecentPatients(
        Array.isArray(patsRes?.data) ? patsRes.data.slice(0, 5) : patsRes?.data?.content?.slice(0, 5) || []
      );
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Unable to retrieve real-time hospital analytics from Railway database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto refresh dashboard on browser window focus
    const handleFocus = () => {
      fetchDashboardData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const quickActions = [
    { label: 'Emergency 24/7', icon: 'emergency', path: '/admin/emergencies', color: 'text-rose-600', bg: 'bg-rose-50', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { label: 'Receptionist Desk', icon: 'desk', path: '/admin/receptionist-desk', color: 'text-amber-700', bg: 'bg-amber-50', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'Nurse Desk', icon: 'medical_services', path: '/admin/nurses', color: 'text-teal-700', bg: 'bg-teal-50', roles: ['ADMIN', 'NURSE'] },
    { label: 'Bed & ICU Desk', icon: 'hotel', path: '/admin/beds', color: 'text-teal-700', bg: 'bg-teal-50', roles: ['ADMIN', 'RECEPTIONIST', 'NURSE'] },
    { label: 'Register Patient', icon: 'person_add', path: '/patients', color: 'text-primary', bg: 'bg-primary/10', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'Book Appointment', icon: 'event_available', path: '/appointments', color: 'text-emerald-700', bg: 'bg-emerald-50', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'Create Prescription', icon: 'prescriptions', path: '/prescriptions', color: 'text-purple-700', bg: 'bg-purple-50', roles: ['ADMIN', 'DOCTOR'] },
    { label: 'Billing Desk', icon: 'receipt_long', path: '/billing', color: 'text-amber-700', bg: 'bg-amber-50', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'User Accounts', icon: 'manage_accounts', path: '/admin/users', color: 'text-indigo-700', bg: 'bg-indigo-50', roles: ['ADMIN'] },
    { label: 'Departments', icon: 'domain', path: '/admin/departments', color: 'text-sky-700', bg: 'bg-sky-50', roles: ['ADMIN'] },
  ].filter((a) => hasRole(a.roles));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-surface-container-high rounded-xl w-64 animate-pulse" />
        <CardSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Welcome back, {user?.fullName || user?.username || 'Administrator'}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Real-Time Hospital Management Console • Role: <strong className="text-primary">{user?.role}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface border border-outline-variant hover:border-primary/40 text-on-surface transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-primary">refresh</span>
            <span>Refresh Stats</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Database Synchronized
          </span>
        </div>
      </div>

      {/* Primary Interactive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="group"
          label="Total Patients"
          value={stats.totalPatients}
          subtext="Persisted Patient Records"
          color="text-primary"
          bgColor="bg-primary/10"
          onClick={() => navigate('/patients')}
        />
        <StatCard
          icon="stethoscope"
          label="Total Doctors"
          value={stats.totalDoctors}
          subtext="Medical Consultants Roster"
          color="text-emerald-700"
          bgColor="bg-emerald-50"
          onClick={() => navigate('/doctors')}
        />
        <StatCard
          icon="support_agent"
          label="Total Receptionists"
          value={stats.totalReceptionists}
          subtext="Front Desk Operations"
          color="text-amber-700"
          bgColor="bg-amber-50"
          onClick={() => navigate('/admin/users?role=RECEPTIONIST')}
        />
        <StatCard
          icon="medical_services"
          label="Total Nurses"
          value={stats.totalNurses}
          subtext="Clinical Nursing Roster"
          color="text-teal-700"
          bgColor="bg-teal-50"
          onClick={() => navigate('/admin/nurses')}
        />
      </div>

      {/* Secondary Operational Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="event_available"
          label="Today's Appointments"
          value={stats.todayAppointments}
          subtext={`Total: ${stats.totalAppointments} • Pending: ${stats.pendingAppointments}`}
          color="text-purple-700"
          bgColor="bg-purple-50"
          onClick={() => navigate('/appointments')}
        />
        <StatCard
          icon="hotel"
          label="Bed Availability"
          value={`${stats.availableBeds || 0} / ${stats.totalBeds || 0}`}
          subtext={`${stats.occupiedBeds || 0} Occupied • ${stats.reservedBeds || 0} Reserved`}
          color="text-teal-700"
          bgColor="bg-teal-50"
          onClick={() => navigate('/admin/beds')}
        />
        <StatCard
          icon="prescriptions"
          label="Prescriptions Issued"
          value={stats.totalPrescriptions}
          subtext="Active Clinical Formulations"
          color="text-indigo-700"
          bgColor="bg-indigo-50"
          onClick={() => navigate('/prescriptions')}
        />
        {hasRole(['ADMIN']) ? (
          <StatCard
            icon="payments"
            label="Total Revenue & Billing"
            value={formatINR(stats.totalRevenue)}
            subtext={`Paid: ${stats.paidBills || 0} • Pending: ${stats.pendingBills || 0}`}
            color="text-amber-700"
            bgColor="bg-amber-50"
            onClick={() => navigate('/billing')}
          />
        ) : (
          <StatCard
            icon="receipt_long"
            label="Pending Bills"
            value={stats.pendingBills}
            subtext={`Total Invoices: ${stats.totalBills}`}
            color="text-amber-700"
            bgColor="bg-amber-50"
            onClick={() => navigate('/billing')}
          />
        )}
      </div>

      {/* Tertiary Analytical Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          icon="emergency"
          label="Emergency Cases"
          value={stats.emergencyCases}
          subtext={`${stats.availableEmergencyBeds || 0} ER Beds Open`}
          color="text-rose-600"
          bgColor="bg-rose-50"
          onClick={() => navigate('/admin/emergencies')}
        />
        <StatCard
          icon="clinical_notes"
          label="Medical Reports"
          value={stats.medicalReports}
          subtext="Finalized Lab & Imaging Reports"
          color="text-sky-700"
          bgColor="bg-sky-50"
          onClick={() => navigate('/medical-reports')}
        />
        <StatCard
          icon="domain"
          label="Hospital Departments"
          value={stats.departments}
          subtext="Active Clinical Specialties"
          color="text-indigo-700"
          bgColor="bg-indigo-50"
          onClick={() => navigate('/admin/departments')}
        />
        <StatCard
          icon="manage_accounts"
          label="System User Accounts"
          value={stats.totalUsers}
          subtext={`${stats.activeUsers || 0} Active Staff & Patients`}
          color="text-purple-700"
          bgColor="bg-purple-50"
          onClick={() => navigate('/admin/users')}
        />
      </div>

      {/* Quick Action Navigation */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Quick Management Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.path}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-outline-variant hover:border-primary/40 hover:shadow-sm transition-all group bg-surface hover:bg-surface-container-low"
            >
              <div
                className={`w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs`}
              >
                <span className={`material-symbols-outlined ${a.color} text-xl`}>{a.icon}</span>
              </div>
              <span className="text-xs font-bold text-on-surface text-center leading-snug">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-surface-variant bg-surface-container-low/30">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Scheduled Consultations</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Recent clinical appointments from database</p>
            </div>
            <Link to="/appointments" className="text-primary text-xs font-bold hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-surface-variant flex-1">
            {recentAppointments.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">event_busy</span>
                <p>No appointments booked for today yet.</p>
              </div>
            ) : (
              recentAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 hover:bg-surface transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-xs">
                      {(apt.patient?.fullName || apt.patientName || 'P').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">
                        {apt.patient?.fullName || apt.patientName}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {apt.appointmentTime} with {apt.doctor?.fullName || apt.doctorName}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} size="xs" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Registered Patients */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-surface-variant bg-surface-container-low/30">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Recent Patients</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Newly registered medical profiles</p>
            </div>
            <Link to="/patients" className="text-primary text-xs font-bold hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-surface-variant flex-1">
            {recentPatients.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">person_off</span>
                <p>No recent patients found in the system.</p>
              </div>
            ) : (
              recentPatients.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-surface transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {(p.fullName || 'P').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{p.fullName}</p>
                      <p className="text-xs text-on-surface-variant font-mono">
                        {p.patientCode} • {p.gender} • {p.bloodGroup}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} size="xs" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
