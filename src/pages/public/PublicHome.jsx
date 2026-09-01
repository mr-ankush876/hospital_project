import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { publicApi } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';

const PublicHome = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [bedStats, setBedStats] = useState(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, depRes, bRes, hRes] = await Promise.allSettled([
          publicApi.getDoctors(),
          publicApi.getDepartments(),
          publicApi.getBedAvailability(),
          publicApi.getHospitalInfo(),
        ]);

        if (dRes.status === 'fulfilled') setDoctors(dRes.value.data || []);
        if (depRes.status === 'fulfilled') setDepartments(depRes.value.data || []);
        if (bRes.status === 'fulfilled') setBedStats(bRes.value.data || null);
        if (hRes.status === 'fulfilled') setHospitalInfo(hRes.value.data || null);
      } catch (err) {
        console.error('Error fetching public hospital data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-surface-container-low/40 to-background py-16 sm:py-24 border-b border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Digital Hospital Network • 24/7 Precision Care
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight leading-tight">
                Clinical Precision Healthcare for <span className="text-primary">Every Life</span>
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Connect directly with board-certified physicians, explore real-time bed & ICU availability, access instant diagnostic lab reports, and manage online consultations seamlessly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/patient/book-appointment"
                  className="w-full sm:w-auto bg-primary text-on-primary font-bold px-6 py-3.5 rounded-xl hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-xl">event_available</span>
                  <span>Book Doctor Appointment</span>
                </Link>

                <Link
                  to="/public-beds"
                  className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant hover:border-primary/50 text-on-surface font-bold px-6 py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm hover:bg-surface"
                >
                  <span className="material-symbols-outlined text-xl text-primary">hotel</span>
                  <span>Live Bed & ICU Tracker</span>
                </Link>
              </div>

              {/* Key Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-outline-variant/60 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                    {doctors.length > 0 ? `${doctors.length}+` : '15+'}
                  </p>
                  <p className="text-xs text-on-surface-variant font-semibold mt-0.5">Top Specialists</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {bedStats?.availableBeds !== undefined ? bedStats.availableBeds : '25'}
                  </p>
                  <p className="text-xs text-on-surface-variant font-semibold mt-0.5">Beds Available</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-purple-600">24/7</p>
                  <p className="text-xs text-on-surface-variant font-semibold mt-0.5">Emergency Trauma</p>
                </div>
              </div>
            </div>

            {/* Right Card / Live Tracker Preview */}
            <div className="lg:col-span-5">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-xl p-6 sm:p-8 space-y-6 relative">
                <div className="flex items-center justify-between border-b border-surface-variant pb-4">
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Live Hospital Status</h3>
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">Real-time database sync</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    ONLINE
                  </span>
                </div>

                {/* Live Bed Summary */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">medical_services</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">ICU Critical Care</p>
                        <p className="text-[11px] text-on-surface-variant">Ventilator equipped</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-on-surface">
                        {bedStats?.availableIcuBeds ?? 6} / {bedStats?.totalIcuBeds ?? 10}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Available Now</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">e911_emergency</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Emergency & Trauma</p>
                        <p className="text-[11px] text-on-surface-variant">Acute response bay</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-on-surface">
                        {bedStats?.availableEmergencyBeds ?? 6} / {bedStats?.totalEmergencyBeds ?? 8}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Available Now</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">hotel</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">General Inpatient Ward</p>
                        <p className="text-[11px] text-on-surface-variant">Standard medical suites</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-on-surface">
                        {bedStats?.availableGeneralBeds ?? 11} / {bedStats?.totalGeneralBeds ?? 15}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Available Now</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/login?tab=register"
                    className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-on-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <span>Register as Patient to Reserve &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Our Medical Faculty</p>
              <h2 className="text-3xl font-extrabold text-on-surface">Consult With Top Specialists</h2>
            </div>
            <Link to="/public-doctors" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
              <span>View All Doctors</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.imageUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face'}
                      alt={doc.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/60 shadow-xs group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-on-surface leading-snug">{doc.fullName}</h3>
                      <p className="text-xs text-primary font-semibold">{doc.specialization}</p>
                      <div className="mt-1">
                        <StatusBadge status={doc.status} size="xs" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {doc.qualification} • {doc.experience}
                  </p>

                  <div className="bg-surface p-2.5 rounded-xl text-[11px] text-on-surface-variant space-y-1 border border-outline-variant/40">
                    <p className="font-semibold text-on-surface">
                      📅 {doc.availableDays || 'Mon - Fri'}
                    </p>
                    <p>⏰ {doc.availableTime || '09:00 AM - 05:00 PM'}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-surface-variant flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">
                    ${doc.consultationFee || '100.00'} / visit
                  </span>
                  <Link
                    to="/patient/book-appointment"
                    className="bg-primary text-on-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary-container transition-colors shadow-xs"
                  >
                    Book &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hospital Departments Section */}
      <section className="py-16 bg-surface-container-low/50 border-t border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Clinical Specialties</p>
            <h2 className="text-3xl font-extrabold text-on-surface">Comprehensive Hospital Departments</h2>
            <p className="text-sm text-on-surface-variant mt-2">
              Equipped with high-precision diagnostic and surgical technologies operated by multidisciplinary medical teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.slice(0, 6).map((dept) => (
              <div
                key={dept.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {dept.departmentCode || 'DEP'}
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {dept.availableBeds ?? 0} Beds Free
                  </span>
                </div>
                <h3 className="font-bold text-base text-on-surface">{dept.name}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                  {dept.description}
                </p>
                <p className="text-xs text-on-surface font-semibold pt-2 border-t border-surface-variant">
                  Head: <span className="text-primary">{dept.headDoctorName || 'Chief Consultant'}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/public-departments"
              className="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline-variant text-primary font-bold text-xs px-5 py-3 rounded-xl hover:bg-surface transition-all shadow-xs"
            >
              <span>Explore All 12 Departments</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default PublicHome;
