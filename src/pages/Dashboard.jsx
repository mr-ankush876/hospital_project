import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const StatCard = ({ icon, label, value, color, bgColor }) => (
  <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center`}>
        <span className={`material-symbols-outlined ${color} text-2xl`}>{icon}</span>
      </div>
    </div>
    <p className="font-stats-lg text-stats-lg text-on-surface tracking-tight">{value}</p>
    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">{label}</p>
  </div>
);

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    pendingBills: 0,
    totalRevenue: 0,
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

      setStats(statsRes.data || { totalPatients: 0, totalDoctors: 0, todayAppointments: 0, pendingBills: 0, totalRevenue: 0 });
      setRecentAppointments(
        Array.isArray(aptsRes.data) ? aptsRes.data.slice(0, 5) : aptsRes.data?.content?.slice(0, 5) || []
      );
      setRecentPatients(
        Array.isArray(patsRes.data) ? patsRes.data.slice(0, 5) : patsRes.data?.content?.slice(0, 5) || []
      );
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Unable to retrieve real-time hospital analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const quickActions = [
    { label: 'Emergency 24/7', icon: 'emergency', path: '/admin/emergencies', color: 'text-rose-600', bg: 'bg-rose-50', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { label: 'Receptionist Desk', icon: 'desk', path: '/admin/receptionist-desk', color: 'text-amber-700', bg: 'bg-amber-50', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'Bed & ICU Desk', icon: 'hotel', path: '/admin/beds', color: 'text-teal-700', bg: 'bg-teal-50', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'Register Patient', icon: 'person_add', path: '/patients', color: 'text-primary', bg: 'bg-primary/10', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'Book Appointment', icon: 'event_available', path: '/appointments', color: 'text-emerald-700', bg: 'bg-emerald-50', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'Create Prescription', icon: 'prescriptions', path: '/prescriptions', color: 'text-purple-700', bg: 'bg-purple-50', roles: ['ADMIN', 'DOCTOR'] },
    { label: 'Billing Desk', icon: 'receipt_long', path: '/billing', color: 'text-amber-700', bg: 'bg-amber-50', roles: ['ADMIN', 'RECEPTIONIST'] },
    { label: 'User & Accounts', icon: 'manage_accounts', path: '/admin/users', color: 'text-indigo-700', bg: 'bg-indigo-50', roles: ['ADMIN'] },
    { label: 'Departments', icon: 'domain', path: '/admin/departments', color: 'text-sky-700', bg: 'bg-sky-50', roles: ['ADMIN'] },
  ].filter((a) => hasRole(a.roles));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-surface-container-high rounded-xl w-64 animate-pulse" />
        <CardSkeleton count={4} />
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
            Hospital Operations Overview • Role: <strong className="text-primary">{user?.role}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Live & Synchronized
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon="group"
          label="Total Patients"
          value={stats.totalPatients}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon="medical_services"
          label="Active Doctors"
          value={stats.totalDoctors}
          color="text-emerald-700"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon="event_available"
          label="Today's Appointments"
          value={stats.todayAppointments}
          color="text-purple-700"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon="hotel"
          label="Available Beds"
          value={`${stats.availableBeds || 0} / ${stats.totalBeds || 0}`}
          color="text-teal-700"
          bgColor="bg-teal-50"
        />
        {hasRole(['ADMIN']) ? (
          <StatCard
            icon="payments"
            label="Total Revenue"
            value={formatINR(stats.totalRevenue)}
            color="text-amber-700"
            bgColor="bg-amber-50"
          />
        ) : (
          <StatCard
            icon="receipt"
            label="Pending Invoices"
            value={stats.pendingBills}
            color="text-amber-700"
            bgColor="bg-amber-50"
          />
        )}
      </div>

      {/* Live Capacity & Emergency Quick Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">hotel</span>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-on-surface-variant">General & ICU Beds</p>
              <p className="text-sm font-extrabold text-on-surface">
                {stats.availableBeds || 0} Vacant • {stats.occupiedBeds || 0} Occupied
              </p>
            </div>
          </div>
          <Link to="/admin/beds" className="text-xs font-bold text-primary hover:underline">
            Manage &rarr;
          </Link>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">monitor_heart</span>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-on-surface-variant">ICU Live Beds</p>
              <p className="text-sm font-extrabold text-on-surface">
                {stats.availableIcuBeds || 0} ICU Available ({stats.totalIcuBeds || 0} Total)
              </p>
            </div>
          </div>
          <Link to="/admin/beds" className="text-xs font-bold text-primary hover:underline">
            View &rarr;
          </Link>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 font-bold flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">emergency</span>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-on-surface-variant">Emergency 24/7 Desk</p>
              <p className="text-sm font-extrabold text-on-surface">
                {stats.availableEmergencyBeds || 0} ER Beds Open
              </p>
            </div>
          </div>
          <Link to="/admin/emergencies" className="text-xs font-bold text-rose-600 hover:underline">
            Desk &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
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
              <p className="text-xs text-on-surface-variant mt-0.5">Recent clinical appointments</p>
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
              <p className="text-xs text-on-surface-variant mt-0.5">Newly admitted medical profiles</p>
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
