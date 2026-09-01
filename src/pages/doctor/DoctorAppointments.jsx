import React, { useState, useEffect } from 'react';
import { doctorPortalApi, appointmentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const toast = useToast();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await doctorPortalApi.getAppointments();
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await appointmentApi.updateStatus(id, newStatus);
      toast.success(`Appointment status updated to ${newStatus}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update appointment status.');
    }
  };

  const filtered = appointments.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Consultation Schedule & Appointments</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Manage your patient appointments, update consultation status, and start clinical workflows.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="ALL">All Statuses</option>
          <option value="Confirmed">Confirmed</option>
          <option value="In Progress">In Progress</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <Loader message="Loading consultation schedule..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="event_available"
          title="No Appointments Found"
          description="There are no consultations matching your selected filter."
        />
      ) : (
        <div className="space-y-3.5">
          {filtered.map((apt) => (
            <div
              key={apt.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold flex flex-col items-center justify-center text-xs flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">person</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{apt.appointmentCode}</span>
                    <span className="font-bold text-sm text-on-surface">{apt.patientName}</span>
                    <span className="font-mono text-xs text-on-surface-variant">({apt.patientCode})</span>
                    <StatusBadge status={apt.status} size="xs" />
                  </div>
                  <p className="text-xs text-on-surface">
                    <strong>Reason:</strong> {apt.reason || 'General Consultation'}
                  </p>
                  {apt.notes && (
                    <p className="text-xs text-on-surface-variant italic">
                      Patient Notes: "{apt.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-surface-variant">
                <div className="text-left md:text-right text-xs">
                  <p className="font-bold text-on-surface">📅 {apt.appointmentDate}</p>
                  <p className="text-on-surface-variant">⏰ {apt.appointmentTime}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {apt.status !== 'Completed' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'In Progress')}
                      className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {apt.status !== 'Completed' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'Completed')}
                      className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
