import React, { useState, useEffect } from 'react';
import { patientPortalApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState(null);

  const toast = useToast();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await patientPortalApi.getPrescriptions();
        setPrescriptions(res.data || []);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        toast.error('Failed to load prescriptions.');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">My Prescriptions & Active Medicines</h1>
        <p className="text-xs text-on-surface-variant">
          Review medications prescribed by attending physicians, dosage instructions, and refill follow-up schedules.
        </p>
      </div>

      {loading ? (
        <Loader message="Loading your prescriptions..." />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon="prescriptions"
          title="No Prescriptions on File"
          description="You do not have any prescriptions issued by your consulting doctors."
        />
      ) : (
        <div className="space-y-6">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-variant gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-primary">{rx.prescriptionCode}</span>
                    <span className="text-xs font-semibold text-on-surface-variant">• Date: {rx.prescriptionDate}</span>
                  </div>
                  <h3 className="font-bold text-base text-on-surface mt-1">
                    Diagnosis: <span className="text-primary">{rx.diagnosis || 'Clinical Consultation'}</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Attending Physician: <strong>{rx.doctorName || 'Hospital Doctor'}</strong>
                  </p>
                </div>

                {rx.followUpDate && (
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                    <p className="font-bold text-primary">Next Follow-Up</p>
                    <p className="font-mono text-[11px] text-on-surface">{rx.followUpDate}</p>
                  </div>
                )}
              </div>

              {/* Symptoms & Clinical Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface p-3.5 rounded-xl text-xs border border-outline-variant/40">
                {rx.symptoms && (
                  <div>
                    <span className="font-bold text-on-surface uppercase tracking-wider text-[10px] block mb-0.5">Reported Symptoms</span>
                    <p className="text-on-surface-variant">{rx.symptoms}</p>
                  </div>
                )}
                {rx.instructions && (
                  <div>
                    <span className="font-bold text-on-surface uppercase tracking-wider text-[10px] block mb-0.5">Doctor Instructions</span>
                    <p className="text-on-surface-variant">{rx.instructions}</p>
                  </div>
                )}
              </div>

              {/* Medicines Table */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2.5">
                  Prescribed Medications ({rx.medicines?.length || 0})
                </h4>

                {(!rx.medicines || rx.medicines.length === 0) ? (
                  <p className="text-xs text-on-surface-variant italic">No medications listed.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                        <tr>
                          <th className="py-2.5 px-4">Medicine Name</th>
                          <th className="py-2.5 px-4">Dosage</th>
                          <th className="py-2.5 px-4">Frequency</th>
                          <th className="py-2.5 px-4">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-variant">
                        {rx.medicines.map((m, idx) => (
                          <tr key={idx} className="hover:bg-surface transition-colors">
                            <td className="py-3 px-4 font-bold text-on-surface flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-primary">medication</span>
                              <span>{m.medicineName}</span>
                            </td>
                            <td className="py-3 px-4 text-on-surface font-mono">{m.dosage}</td>
                            <td className="py-3 px-4 font-semibold text-primary">{m.frequency}</td>
                            <td className="py-3 px-4 text-on-surface-variant">{m.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;
