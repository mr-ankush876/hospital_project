import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { searchApi } from '../../services/api';

const Topbar = ({ onOpenMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    users: [],
    patients: [],
    doctors: [],
    appointments: [],
    prescriptions: [],
    bills: [],
    departments: []
  });
  const [searching, setSearching] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle global quick search backed by MySQL
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({
        users: [],
        patients: [],
        doctors: [],
        appointments: [],
        prescriptions: [],
        bills: [],
        departments: []
      });
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchApi.globalSearch(searchQuery.trim());
        const data = res.data || {};
        setSearchResults({
          users: data.users || [],
          patients: data.patients || [],
          doctors: data.doctors || [],
          appointments: data.appointments || [],
          prescriptions: data.prescriptions || [],
          bills: data.bills || [],
          departments: data.departments || []
        });
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname.replace('/', '');
    if (!path || path === 'dashboard') return 'Clinical Dashboard';
    if (path.startsWith('patient/')) return 'Patient Portal';
    if (path.startsWith('doctor/')) return 'Doctor Portal';
    if (path.startsWith('admin/')) return 'Administration';
    return path.charAt(0).toUpperCase() + path.slice(1) + ' Management';
  };

  const hasAnyResults =
    searchResults.users.length > 0 ||
    searchResults.patients.length > 0 ||
    searchResults.doctors.length > 0 ||
    searchResults.appointments.length > 0 ||
    searchResults.prescriptions.length > 0 ||
    searchResults.bills.length > 0 ||
    searchResults.departments.length > 0;

  return (
    <>
      <header className="bg-surface border-b border-surface-variant shadow-sm h-16 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 w-full">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onOpenMobile}
            className="md:hidden text-on-surface-variant p-2 hover:bg-surface-container-high rounded-lg transition-all"
            aria-label="Open navigation drawer"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-on-surface text-base md:text-lg">{getPageTitle()}</span>
          </div>
        </div>

        {/* Right: Search, Notifications & User */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Global Search Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant hover:border-primary/40 rounded-full text-on-surface-variant text-xs md:text-sm font-medium transition-all shadow-sm group cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg text-outline group-hover:text-primary transition-colors">
                search
              </span>
              <span className="hidden sm:inline text-outline group-hover:text-on-surface">Search hospital database...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-surface-container-high border border-outline-variant rounded font-mono text-outline">
                /
              </kbd>
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all relative cursor-pointer"
              aria-label="View notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-4 z-50 animate-scale-up">
                <div className="flex items-center justify-between border-b border-surface-variant pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">notifications_active</span>
                    <h4 className="font-bold text-sm text-on-surface">Clinical Alerts</h4>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                    <p className="font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Database Online & Ready
                    </p>
                    <p className="text-on-surface-variant text-[11px] mt-0.5">
                      VitalSync MySQL persistence connected.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                    <p className="font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Appointments Active
                    </p>
                    <p className="text-on-surface-variant text-[11px] mt-0.5">
                      Check appointment schedule for real-time updates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container-high transition-all cursor-pointer"
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-primary-container text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-primary/20">
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'VS'}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-4 z-50 animate-scale-up">
                <div className="border-b border-surface-variant pb-3 mb-3">
                  <p className="font-bold text-sm text-on-surface truncate">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">{user?.email}</p>
                  <div className="mt-2">
                    <StatusBadge status={user?.role} size="xs" />
                  </div>
                </div>
                <div className="space-y-1 text-sm font-medium">
                  <Link
                    to={user?.role === 'PATIENT' ? '/patient/profile' : user?.role === 'DOCTOR' ? '/doctor/profile' : '/settings'}
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface hover:text-on-surface transition-colors flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-base">manage_accounts</span>
                    <span>Account Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-20 p-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-surface-variant flex items-center gap-3 bg-surface-container-low/30">
              <span className="material-symbols-outlined text-primary text-2xl">search</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search database (users, doctors, patients, appointments, prescriptions, bills)..."
                className="w-full bg-transparent text-on-surface placeholder:text-outline font-medium text-sm sm:text-base focus:outline-none"
              />
              {searching && (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Search Results */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {!searchQuery.trim() ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-3xl text-outline mb-2">manage_search</span>
                  <p>Type keywords to search live hospital records from MySQL database.</p>
                </div>
              ) : !hasAnyResults && !searching ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">
                  <p className="font-semibold text-on-surface">No matches found for "{searchQuery}"</p>
                  <p className="text-xs text-outline mt-1">Try searching by name, ID, code, phone, email, specialization, or status.</p>
                </div>
              ) : (
                <>
                  {/* Users (Admin Only) */}
                  {searchResults.users.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">manage_accounts</span>
                        System Users ({searchResults.users.length})
                      </p>
                      <div className="space-y-1.5">
                        {searchResults.users.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/admin/users');
                            }}
                            className="p-2.5 rounded-xl hover:bg-surface border border-outline-variant/40 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                {u.fullName?.substring(0, 2).toUpperCase() || 'U'}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">{u.fullName} <span className="font-mono text-xs text-outline">(@{u.username})</span></p>
                                <p className="text-xs text-on-surface-variant">{u.email} • {u.phone || 'No phone'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant uppercase">
                                {u.role}
                              </span>
                              <StatusBadge status={u.status} size="xs" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doctors */}
                  {searchResults.doctors.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-emerald-600">stethoscope</span>
                        Doctors ({searchResults.doctors.length})
                      </p>
                      <div className="space-y-1.5">
                        {searchResults.doctors.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setSearchOpen(false);
                              if (user?.role === 'PATIENT') {
                                navigate('/patient/book-appointment');
                              } else {
                                navigate('/doctors');
                              }
                            }}
                            className="p-2.5 rounded-xl hover:bg-surface border border-outline-variant/40 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
                                {d.fullName?.substring(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">{d.fullName}</p>
                                <p className="text-xs text-on-surface-variant">{d.specialization} • {d.doctorCode} • {d.qualification}</p>
                              </div>
                            </div>
                            <StatusBadge status={d.status} size="xs" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Patients */}
                  {searchResults.patients.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">person</span>
                        Patients ({searchResults.patients.length})
                      </p>
                      <div className="space-y-1.5">
                        {searchResults.patients.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSearchOpen(false);
                              if (user?.role === 'DOCTOR') {
                                navigate('/doctor/patients');
                              } else {
                                navigate('/patients');
                              }
                            }}
                            className="p-2.5 rounded-xl hover:bg-surface border border-outline-variant/40 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                {p.fullName?.substring(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">{p.fullName}</p>
                                <p className="text-xs text-on-surface-variant">{p.patientCode} • {p.phone} • {p.bloodGroup || 'Blood: N/A'}</p>
                              </div>
                            </div>
                            <StatusBadge status={p.status} size="xs" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Appointments */}
                  {searchResults.appointments.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-purple-600">event</span>
                        Appointments ({searchResults.appointments.length})
                      </p>
                      <div className="space-y-1.5">
                        {searchResults.appointments.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              setSearchOpen(false);
                              if (user?.role === 'PATIENT') {
                                navigate('/patient/appointments');
                              } else if (user?.role === 'DOCTOR') {
                                navigate('/doctor/appointments');
                              } else {
                                navigate('/appointments');
                              }
                            }}
                            className="p-2.5 rounded-xl hover:bg-surface border border-outline-variant/40 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-1.5 rounded-lg text-lg">
                                event
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">
                                  {a.patientName || a.patient?.fullName || 'Patient'} with {a.doctorName || a.doctor?.fullName || 'Doctor'}
                                </p>
                                <p className="text-xs text-on-surface-variant">{a.appointmentCode} • {a.appointmentDate} at {a.appointmentTime}</p>
                              </div>
                            </div>
                            <StatusBadge status={a.status} size="xs" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {searchResults.prescriptions.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-teal-600">prescriptions</span>
                        Prescriptions ({searchResults.prescriptions.length})
                      </p>
                      <div className="space-y-1.5">
                        {searchResults.prescriptions.map((rx) => (
                          <div
                            key={rx.id}
                            onClick={() => {
                              setSearchOpen(false);
                              if (user?.role === 'PATIENT') {
                                navigate('/patient/prescriptions');
                              } else {
                                navigate('/prescriptions');
                              }
                            }}
                            className="p-2.5 rounded-xl hover:bg-surface border border-outline-variant/40 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-1.5 rounded-lg text-lg">
                                medical_services
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">
                                  {rx.prescriptionCode} • {rx.diagnosis}
                                </p>
                                <p className="text-xs text-on-surface-variant">
                                  Patient: {rx.patientName || rx.patient?.fullName} • Dr. {rx.doctorName || rx.doctor?.fullName} ({rx.prescriptionDate})
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-primary font-semibold hover:underline">View Rx &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bills */}
                  {searchResults.bills.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-amber-600">receipt_long</span>
                        Invoices & Bills ({searchResults.bills.length})
                      </p>
                      <div className="space-y-1.5">
                        {searchResults.bills.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSearchOpen(false);
                              if (user?.role === 'PATIENT') {
                                navigate('/patient/bills');
                              } else {
                                navigate('/billing');
                              }
                            }}
                            className="p-2.5 rounded-xl hover:bg-surface border border-outline-variant/40 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-1.5 rounded-lg text-lg">
                                payments
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">
                                  {b.billCode} • {b.patientName || b.patient?.fullName}
                                </p>
                                <p className="text-xs text-on-surface-variant">
                                  Amount: ${b.totalAmount} • {b.paymentMethod} ({b.billDate})
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={b.paymentStatus} size="xs" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
