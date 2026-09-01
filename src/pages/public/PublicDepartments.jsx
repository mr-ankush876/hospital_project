import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { publicApi } from '../../services/api';
import Loader from '../../components/common/Loader';

const PublicDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await publicApi.getDepartments();
        setDepartments(res.data || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <PublicNavbar />

      <div className="bg-surface-container-low/40 border-b border-outline-variant/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-3">
              <span className="material-symbols-outlined text-sm">domain</span>
              Medical Centers of Excellence
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface">Hospital Departments & Wings</h1>
            <p className="text-sm text-on-surface-variant mt-2">
              Advanced specialized departments with multidisciplinary physician teams, intensive care units, and diagnostic laboratories.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {loading ? (
          <div className="py-20 text-center">
            <Loader message="Loading hospital departments..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {dept.departmentCode || 'DEP'}
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      {dept.availableBeds ?? 0} Beds Free
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-on-surface">{dept.name}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {dept.description || 'Comprehensive clinical specialized diagnostic and treatment services.'}
                  </p>

                  <div className="pt-3 border-t border-surface-variant space-y-1.5 text-xs text-on-surface-variant">
                    <p>
                      Department Head: <strong className="text-on-surface">{dept.headDoctorName || 'Chief of Staff'}</strong>
                    </p>
                    <p>
                      Total Ward Capacity: <strong className="text-on-surface">{dept.totalBeds ?? 0} Beds</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-surface-variant flex items-center justify-between">
                  <Link
                    to="/public-doctors"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>View Doctors</span>
                    <span>&rarr;</span>
                  </Link>
                  <Link
                    to="/patient/book-appointment"
                    className="bg-surface border border-outline-variant hover:border-primary/40 text-on-surface font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                  >
                    Consult Now
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

export default PublicDepartments;
