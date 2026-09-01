import React, { useState, useEffect } from 'react';
import { doctorPortalApi, patientApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletePatient, setDeletePatient] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await doctorPortalApi.getPatients();
      setPatients(res.data || []);
    } catch (err) {
      console.error('Error fetching clinical patients:', err);
      toast.error('Failed to load assigned patient records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async () => {
    if (!deletePatient) return;
    setDeleting(true);
    try {
      await patientApi.delete(deletePatient.id);
      toast.success(`Patient record for ${deletePatient.fullName} removed/deactivated successfully.`);
      setDeletePatient(null);
      fetchPatients();
    } catch (err) {
      console.error('Delete patient error:', err);
      toast.error(err?.response?.data?.message || 'Failed to remove patient record.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = patients.filter((p) => {
    if (!search) return true;
    return (
      p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.patientCode?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Assigned Clinical Patients</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Patients registered under your medical specialty or clinical consultation history.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient by name or code..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {loading ? (
        <Loader message="Loading assigned patients..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="group"
          title="No Patients Found"
          description="No patients match your search query or have been assigned to your queue."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((patient) => (
            <div
              key={patient.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {(patient.fullName || 'P').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface">{patient.fullName}</h3>
                      <p className="font-mono text-xs font-bold text-primary">{patient.patientCode}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        {patient.age} Yrs • {patient.gender} • Blood: <strong className="text-rose-700">{patient.bloodGroup || 'O+'}</strong>
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={patient.status || 'Active'} size="xs" />
                </div>

                <div className="p-3 bg-surface rounded-xl border border-outline-variant/40 text-xs space-y-1 text-on-surface-variant">
                  <p>📞 <strong>Phone:</strong> {patient.phone}</p>
                  <p>📍 <strong>Address:</strong> {patient.address || 'Local'}</p>
                  {patient.allergies && (
                    <p className="text-rose-600 font-semibold">⚠️ Allergies: {patient.allergies}</p>
                  )}
                  {patient.medicalHistory && (
                    <p className="text-on-surface font-medium">📋 History: {patient.medicalHistory}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-variant flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setDeletePatient(patient)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Remove or deactivate patient record"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Delete Patient</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletePatient}
        onClose={() => setDeletePatient(null)}
        onConfirm={handleDelete}
        title="Remove Patient Record"
        message={`Are you sure you want to remove ${deletePatient?.fullName} (${deletePatient?.patientCode})? If active medical or financial records exist, the patient will be safely deactivated.`}
        confirmText={deleting ? 'Removing...' : 'Yes, Remove Patient'}
        danger={true}
      />
    </div>
  );
};

export default DoctorPatients;
