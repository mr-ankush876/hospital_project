import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { patientApi, doctorApi, appointmentApi } from '../../services/api';

const Topbar = ({ onOpenMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ patients: [], doctors: [], appointments: [] });
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

  // Handle global quick search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ patients: [], doctors: [], appointments: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [pRes, dRes, aRes] = await Promise.allSettled([
          patientApi.getAll({ search: searchQuery }),
          doctorApi.getAll({ search: searchQuery }),
          appointmentApi.getAll({ search: searchQuery }),
        ]);

        const getArray = (res) => {
          if (res.status === 'fulfilled' && res.value?.data) {
            return Array.isArray(res.value.data) ? res.value.data : res.value.data.content || [];
          }
          return [];
        };

        setSearchResults({
          patients: getArray(pRes).slice(0, 4),
          doctors: getArray(dRes).slice(0, 4),
          appointments: getArray(aRes).slice(0, 4),
        });
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname.replace('/', '');
    if (!path || path === 'dashboard') return 'Clinical Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1) + ' Management';
  };

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
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant hover:border-primary/40 rounded-full text-on-surface-variant text-xs md:text-sm font-medium transition-all shadow-sm group"
            >
              <span className="material-symbols-outlined text-lg text-outline group-hover:text-primary transition-colors">
                search
              </span>
              <span className="hidden sm:inline text-outline group-hover:text-on-surface">Search records...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-surface-container-high border border-outline-variant rounded font-mono text-outline">
                /
              </kbd>
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all relative"
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
                      System Online & Ready
                    </p>
                    <p className="text-on-surface-variant text-[11px] mt-0.5">
                      VitalSync secure clinical database connected.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                    <p className="font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Appointments Active
                    </p>
                    <p className="text-on-surface-variant text-[11px] mt-0.5">
                      Check today's appointment schedule for real-time updates.
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
              className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container-high transition-all"
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
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface hover:text-on-surface transition-colors flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-base">manage_accounts</span>
                    <span>Account Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5"
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
          className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4"
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
                placeholder="Search patients, doctors, appointments..."
                className="w-full bg-transparent text-on-surface placeholder:text-outline font-medium text-base focus:outline-none"
              />
              {searching && (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Search Results */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {!searchQuery.trim() ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-3xl text-outline mb-2">manage_search</span>
                  <p>Type to search clinical records across patients, doctors, and appointments.</p>
                </div>
              ) : searchResults.patients.length === 0 &&
                searchResults.doctors.length === 0 &&
                searchResults.appointments.length === 0 &&
                !searching ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">
                  <p className="font-semibold text-on-surface">No matches found for "{searchQuery}"</p>
                  <p className="text-xs text-outline mt-1">Try searching by patient name, phone number, doctor or code.</p>
                </div>
              ) : (
                <>
                  {/* Patients */}
                  {searchResults.patients.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Patients</p>
                      <div className="space-y-1.5">
                        {searchResults.patients.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/patients');
                            }}
                            className="p-2.5 rounded-xl hover:bg-surface border border-outline-variant/30 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                {p.fullName?.substring(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">{p.fullName}</p>
                                <p className="text-xs text-on-surface-variant">{p.patientCode} • {p.phone}</p>
                              </div>
                            </div>
                            <span className="text-xs text-primary font-semibold hover:underline">View in Patients &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doctors */}
                  {searchResults.doctors.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Doctors</p>
                      <div className="space-y-1.5">
                        {searchResults.doctors.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/doctors');
                            }}
                            className="p-2.5 rounded-xl hover:bg-surface border border-outline-variant/30 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
                                {d.fullName?.substring(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">{d.fullName}</p>
                                <p className="text-xs text-on-surface-variant">{d.specialization} • {d.doctorCode}</p>
                              </div>
                            </div>
                            <span className="text-xs text-primary font-semibold hover:underline">View in Doctors &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Appointments */}
                  {searchResults.appointments.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Appointments</p>
                      <div className="space-y-1.5">
                        {searchResults.appointments.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/appointments');
                            }}
                            className="p-2.5 rounded-xl hover:bg-surface border border-outline-variant/30 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-1.5 rounded-lg text-lg">
                                event
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">
                                  {a.patient?.fullName || a.patientName || 'Patient'} with {a.doctor?.fullName || a.doctorName || 'Doctor'}
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
