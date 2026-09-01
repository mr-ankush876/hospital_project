import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientPortalApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [cancelModalId, setCancelModalId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const toast = useToast();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await patientPortalApi.getAppointments();
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      toast.error('Failed to load your appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async () => {
    if (!cancelModalId) return;

    setCancelling(true);
    try {
      await patientPortalApi.cancelAppointment(cancelModalId);
      toast.success('Appointment cancelled successfully.');
      setCancelModalId(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return !['Completed', 'Cancelled'].includes(apt.status);
    if (activeTab === 'COMPLETED') return apt.status === 'Completed';
    if (activeTab === 'CANCELLED') return apt.status === 'Cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">My Consultations & Appointments</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Review consultation history, monitor scheduled visits, and manage bookings.
          </p>
        </div>
        <Link
          to="/patient/book-appointment"
          className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Book New Consultation</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-variant pb-2 overflow-x-auto">
        {[
          { label: 'All Consultations', value: 'ALL' },
          { label: 'Upcoming / Scheduled', value: 'UPCOMING' },
          { label: 'Completed History', value: 'COMPLETED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.value
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main List */}
      {loading ? (
        <Loader message="Loading your consultation records..." />
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon="event_busy"
          title="No Consultations Found"
          description={
            activeTab === 'UPCOMING'
              ? 'You do not have any upcoming doctor appointments.'
              : 'No appointments match the selected filter.'
          }
          actionLabel="Book Appointment"
          onAction={() => window.location.href = '/patient/book-appointment'}
        />
      ) : (
        <div className="space-y-3.5">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex flex-col items-center justify-center font-extrabold text-xs flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">event</span>
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{apt.appointmentCode}</span>
                    <StatusBadge status={apt.status} size="xs" />
                  </div>
                  <h3 className="font-bold text-sm text-on-surface">
                    {apt.doctorName || apt.doctor?.fullName || 'Attending Physician'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Specialization: <strong>{apt.doctorSpecialization || apt.doctor?.specialization || 'Clinical'}</strong>
                  </p>
                  <p className="text-xs text-on-surface">
                    <strong>Reason:</strong> {apt.reason || 'General Consultation'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-surface-variant">
                <div className="text-left md:text-right text-xs">
                  <p className="font-bold text-on-surface">📅 {apt.appointmentDate}</p>
                  <p className="text-on-surface-variant">⏰ {apt.appointmentTime}</p>
                </div>

                {!['Completed', 'Cancelled'].includes(apt.status) && (
                  <button
                    type="button"
                    onClick={() => setCancelModalId(apt.id)}
                    className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancelModalId}
        onClose={() => setCancelModalId(null)}
        onConfirm={handleCancelAppointment}
        title="Cancel Consultation"
        message="Are you sure you want to cancel this appointment? The reserved doctor slot will be released."
        confirmText={cancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
        danger={true}
      />
    </div>
  );
};

export default PatientAppointments;
