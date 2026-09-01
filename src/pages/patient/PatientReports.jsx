import React, { useState, useEffect } from 'react';
import { patientPortalApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const PatientReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState(null);

  const toast = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await patientPortalApi.getReports();
        setReports(res.data || []);
      } catch (err) {
        console.error('Error fetching reports:', err);
        toast.error('Failed to retrieve medical reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Medical & Diagnostic Reports</h1>
        <p className="text-xs text-on-surface-variant">
          Access verified laboratory biochemistry, pathology investigations, and medical imaging diagnostics.
        </p>
      </div>

      {loading ? (
        <Loader message="Loading diagnostic reports..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon="description"
          title="No Medical Reports Found"
          description="You do not have any published diagnostic or pathology test reports."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">
              Available Reports ({reports.length})
            </h3>
            {reports.map((rep) => {
              const isSelected = activeReport?.id === rep.id || (!activeReport && reports[0]?.id === rep.id);
              return (
                <div
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-surface-container-lowest border-outline-variant hover:border-primary/40 hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-mono text-xs font-bold ${isSelected ? 'text-white' : 'text-primary'}`}>
                      {rep.reportCode}
                    </span>
                    <span className={`text-[10px] font-semibold ${isSelected ? 'text-white/80' : 'text-on-surface-variant'}`}>
                      {rep.reportDate}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm leading-snug">{rep.reportType}</h4>
                  <p className={`text-xs mt-1 truncate ${isSelected ? 'text-white/80' : 'text-on-surface-variant'}`}>
                    Doctor: {rep.doctorName || 'Clinical Specialist'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Report Detailed View */}
          <div className="lg:col-span-2">
            {(() => {
              const rep = activeReport || reports[0];
              if (!rep) return null;

              return (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-variant pb-4 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-primary">{rep.reportCode}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rep.status || 'Final'}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-on-surface mt-1">{rep.reportType}</h2>
                      <p className="text-xs text-on-surface-variant">
                        Department: <strong>{rep.departmentName || 'Diagnostics'}</strong> • Date: <strong>{rep.reportDate}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="bg-surface border border-outline-variant hover:border-primary/40 text-on-surface text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      <span>Print Document</span>
                    </button>
                  </div>

                  {/* Clinical Summary */}
                  <div className="space-y-4">
                    {rep.diagnosis && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-primary">Diagnostic Impression</h4>
                        <p className="text-sm font-semibold text-on-surface">{rep.diagnosis}</p>
                      </div>
                    )}

                    {rep.symptoms && (
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Clinical Presentation</h4>
                        <p className="text-xs text-on-surface bg-surface p-3 rounded-xl border border-outline-variant/40">
                          {rep.symptoms}
                        </p>
                      </div>
                    )}

                    {rep.testResults && (
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Laboratory Findings & Biomarkers</h4>
                        <div className="p-4 rounded-xl bg-surface border border-outline-variant/50 text-xs text-on-surface font-mono whitespace-pre-line leading-relaxed">
                          {rep.testResults}
                        </div>
                      </div>
                    )}

                    {rep.doctorNotes && (
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Consultant Clinical Notes</h4>
                        <p className="text-xs text-on-surface bg-surface p-3 rounded-xl border border-outline-variant/40">
                          {rep.doctorNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-surface-variant flex items-center justify-between text-xs text-on-surface-variant">
                    <p>Verified by: <strong>{rep.doctorName || 'Attending Clinical Pathologist'}</strong></p>
                    <p className="font-mono text-[11px]">VitalSync Certified Diagnostic Record</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientReports;
