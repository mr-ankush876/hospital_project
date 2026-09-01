import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { publicApi } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';

const PublicDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await publicApi.getDoctors();
        setDoctors(res.data || []);
      } catch (err) {
        console.error('Error fetching public doctors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const specialties = ['ALL', ...new Set(doctors.map((d) => d.specialization).filter(Boolean))];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      !search ||
      doc.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      doc.qualification?.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'ALL' || doc.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <PublicNavbar />

      <div className="bg-surface-container-low/40 border-b border-outline-variant/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-3">
              <span className="material-symbols-outlined text-sm">medical_services</span>
              Clinical Faculty Directory
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface">Find & Consult Our Doctors</h1>
            <p className="text-sm text-on-surface-variant mt-2">
              Browse board-certified specialists, review qualifications, consultation schedules, and book direct consultations.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant shadow-xs">
            <div className="sm:col-span-2 relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by doctor name, specialty, or qualification..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
              >
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s === 'ALL' ? 'All Specialties' : s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Doctors Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {loading ? (
          <div className="py-20 text-center">
            <Loader message="Loading doctor directory..." />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="py-16 text-center bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 max-w-md mx-auto">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">person_search</span>
            <h3 className="font-bold text-on-surface">No specialists found</h3>
            <p className="text-xs text-on-surface-variant mt-1">Try adjusting your search criteria or specialty filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={doc.imageUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face'}
                      alt={doc.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border border-outline-variant/60 shadow-xs flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-base text-on-surface">{doc.fullName}</h3>
                      <p className="text-xs font-semibold text-primary">{doc.specialization}</p>
                      <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">{doc.doctorCode}</p>
                      <div className="mt-1.5">
                        <StatusBadge status={doc.status} size="xs" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-on-surface-variant">
                    <p className="font-semibold text-on-surface">{doc.qualification}</p>
                    <p>Experience: <strong>{doc.experience || '10+ Years'}</strong></p>
                    <p>Department: <strong>{doc.departmentName || doc.specialization}</strong></p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-outline-variant/50 text-xs space-y-1">
                    <p className="font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
                      <span>{doc.availableDays || 'Mon - Fri'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                      <span>{doc.availableTime || '09:00 AM - 05:00 PM'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-surface-variant flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">Fee</span>
                    <span className="text-sm font-extrabold text-on-surface">
                      ${doc.consultationFee || '100.00'}
                    </span>
                  </div>
                  <Link
                    to="/patient/book-appointment"
                    className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center gap-1"
                  >
                    <span>Book Appointment</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicDoctors;
