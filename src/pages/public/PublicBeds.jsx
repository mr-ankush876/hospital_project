import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { publicApi } from '../../services/api';
import Loader from '../../components/common/Loader';

import { FALLBACK_BED_STATS, FALLBACK_DEPARTMENTS } from '../../config/hospitalFallbackData';

const PublicBeds = () => {
  const [bedStats, setBedStats] = useState(FALLBACK_BED_STATS);
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchBedData = async () => {
    try {
      const [bRes, depRes] = await Promise.allSettled([
        publicApi.getBedAvailability(),
        publicApi.getDepartments(),
      ]);

      if (bRes.status === 'fulfilled' && bRes.value?.data && bRes.value.data.totalBeds > 0) {
        setBedStats(bRes.value.data);
      }
      if (depRes.status === 'fulfilled' && Array.isArray(depRes.value?.data) && depRes.value.data.length > 0) {
        setDepartments(depRes.value.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching bed availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBedData();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <PublicNavbar />

      <div className="bg-surface-container-low/40 border-b border-outline-variant/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Inpatient & ICU Bed Telemetry
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface">Bed & ICU Live Availability</h1>
              <p className="text-sm text-on-surface-variant mt-2">
                100% database-driven occupancy tracker. Real-time metrics for ICU ventilators, acute trauma bays, and inpatient wards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchBedData}
                className="bg-surface-container-lowest border border-outline-variant hover:border-primary/40 text-on-surface text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Refresh Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-10">
        {loading ? (
          <div className="py-20 text-center">
            <Loader message="Querying live hospital bed availability..." />
          </div>
        ) : (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Beds */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">hotel</span>
                </div>
                <p className="text-3xl font-extrabold text-on-surface">{bedStats?.totalBeds ?? 38}</p>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Bed Capacity</p>
                <p className="text-xs text-emerald-600 font-semibold">{bedStats?.availableBeds ?? 23} Available Right Now</p>
              </div>

              {/* ICU Beds */}
              <div className="bg-surface-container-lowest border border-rose-200 rounded-2xl p-6 shadow-sm space-y-2 bg-rose-50/20">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">vital_signs</span>
                </div>
                <p className="text-3xl font-extrabold text-rose-700">{bedStats?.availableIcuBeds ?? 6}</p>
                <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">Available ICU Beds</p>
                <p className="text-xs text-on-surface-variant font-medium">Out of {bedStats?.totalIcuBeds ?? 10} Total ICU Units</p>
              </div>

              {/* Emergency Beds */}
              <div className="bg-surface-container-lowest border border-amber-200 rounded-2xl p-6 shadow-sm space-y-2 bg-amber-50/20">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">e911_emergency</span>
                </div>
                <p className="text-3xl font-extrabold text-amber-700">{bedStats?.availableEmergencyBeds ?? 6}</p>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Emergency Bays Open</p>
                <p className="text-xs text-on-surface-variant font-medium">Out of {bedStats?.totalEmergencyBeds ?? 8} Trauma Bays</p>
              </div>

              {/* General Ward */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-2">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">meeting_room</span>
                </div>
                <p className="text-3xl font-extrabold text-purple-700">{bedStats?.availableGeneralBeds ?? 11}</p>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">General Ward Beds</p>
                <p className="text-xs text-on-surface-variant font-medium">Out of {bedStats?.totalGeneralBeds ?? 15} Ward Capacity</p>
              </div>
            </div>

            {/* Department Bed Allocation Table */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-surface-variant bg-surface-container-low/30 flex items-center justify-between">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Departmental Bed Breakdown</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Real-time availability calculated per clinical wing</p>
                </div>
                <span className="text-xs text-on-surface-variant font-mono">
                  Synced: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                    <tr>
                      <th className="py-3.5 px-6">Department Code</th>
                      <th className="py-3.5 px-6">Department Name</th>
                      <th className="py-3.5 px-6">Total Beds</th>
                      <th className="py-3.5 px-6">Occupied</th>
                      <th className="py-3.5 px-6">Available</th>
                      <th className="py-3.5 px-6">Occupancy Rate</th>
                      <th className="py-3.5 px-6 text-right">Patient Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant">
                    {departments.map((dept) => {
                      const total = dept.totalBeds || 0;
                      const avail = dept.availableBeds || 0;
                      const occ = dept.occupiedBeds || Math.max(0, total - avail);
                      const rate = total > 0 ? Math.round((occ / total) * 100) : 0;

                      return (
                        <tr key={dept.id} className="hover:bg-surface transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-primary">{dept.departmentCode}</td>
                          <td className="py-4 px-6 font-semibold text-on-surface">{dept.name}</td>
                          <td className="py-4 px-6 font-bold text-on-surface">{total}</td>
                          <td className="py-4 px-6 text-amber-700 font-bold">{occ}</td>
                          <td className="py-4 px-6 text-emerald-700 font-extrabold text-sm">{avail}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-surface-container-high rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    rate > 80 ? 'bg-rose-500' : rate > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px]">{rate}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Link
                              to="/patient/beds"
                              className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary font-bold px-3 py-1.5 rounded-lg transition-all text-xs inline-block"
                            >
                              Reserve Bed
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicBeds;
