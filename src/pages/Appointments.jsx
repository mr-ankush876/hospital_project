import React, { useState, useEffect } from 'react';
import { appointmentApi, patientApi, doctorApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { TableSkeleton } from '../components/common/Loader';
import Pagination from '../components/common/Pagination';

const Appointments = () => {
  const { user, hasRole } = useAuth();
  const toast = useToast();

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals & Drawers
  const [showModal, setShowModal] = useState(false);
  const [editAppointment, setEditAppointment] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:00 AM',
    reason: '',
    notes: '',
    status: 'Scheduled',
  });

  const timeSlots = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM',
    '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  const appointmentStatuses = ['Scheduled', 'Confirmed', 'In Progress', 'Urgent', 'Completed', 'Cancelled'];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aptRes, patRes, docRes] = await Promise.all([
        appointmentApi.getAll(),
        patientApi.getAll(),
        doctorApi.getAll(),
      ]);

      const aptList = Array.isArray(aptRes.data) ? aptRes.data : aptRes.data?.content || [];
      const patList = Array.isArray(patRes.data) ? patRes.data : patRes.data?.content || [];
      const docList = Array.isArray(docRes.data) ? docRes.data : docRes.data?.content || [];

      setAppointments(aptList);
      setPatients(patList);
      setDoctors(docList);
    } catch (err) {
      console.error('Failed to load appointments data:', err);
      setError('Unable to load appointment schedule from the server.');
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, doctorFilter, dateFilter]);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        doctorId: doctorFilter || undefined,
        date: dateFilter || undefined,
      });
      setAppointments(Array.isArray(res.data) ? res.data : res.data?.content || []);
    } catch (err) {
      console.error('Failed to refresh appointments:', err);
    }
  };

  const filtered = appointments;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedAppointments = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAddModal = () => {
    setEditAppointment(null);
    setFormData({
      patientId: patients.length > 0 ? patients[0].id : '',
      doctorId: doctors.length > 0 ? doctors[0].id : '',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '09:00 AM',
      reason: '',
      notes: '',
      status: 'Scheduled',
    });
    setShowModal(true);
  };

  const openEditModal = (apt) => {
    setEditAppointment(apt);
    setFormData({
      patientId: apt.patient?.id || apt.patientId || '',
      doctorId: apt.doctor?.id || apt.doctorId || '',
      appointmentDate: apt.appointmentDate || '',
      appointmentTime: apt.appointmentTime || '09:00 AM',
      reason: apt.reason || '',
      notes: apt.notes || '',
      status: apt.status || 'Scheduled',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      toast.warning('Please fill in all required appointment fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editAppointment) {
        await appointmentApi.update(editAppointment.id, formData);
        toast.success(`Appointment ${editAppointment.appointmentCode} updated successfully.`);
      } else {
        const res = await appointmentApi.create(formData);
        toast.success(`Appointment scheduled successfully (${res.data?.appointmentCode || 'Confirmed'}).`);
      }
      setShowModal(false);
      await fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save appointment.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (apt, newStatus) => {
    try {
      await appointmentApi.updateStatus(apt.id, newStatus);
      toast.success(`Appointment status updated to ${newStatus}.`);
      await fetchAppointments();
      if (showDetail && showDetail.id === apt.id) {
        setShowDetail((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try {
      await appointmentApi.delete(deleteConfirm.id);
      toast.success(`Appointment ${deleteConfirm.appointmentCode} deleted.`);
      setDeleteConfirm(null);
      await fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete appointment.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusCounts = appointmentStatuses.reduce((acc, st) => {
    acc[st] = appointments.filter((a) => a.status === st).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Appointments</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Manage patient bookings, scheduling, and clinic workloads.
          </p>
        </div>
        {hasRole(['ADMIN', 'RECEPTIONIST']) && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-lg">event_available</span>
            <span>Book Appointment</span>
          </button>
        )}
      </div>

      {/* Status Summary Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            statusFilter === ''
              ? 'bg-primary text-on-primary border-primary shadow-sm'
              : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface'
          }`}
        >
          All ({appointments.length})
        </button>
        {appointmentStatuses.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(statusFilter === st ? '' : st)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              statusFilter === st
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface'
            }`}
          >
            {st} ({statusCounts[st] || 0})
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search patient, doctor, code..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Doctor Filter */}
        <select
          value={doctorFilter}
          onChange={(e) => {
            setDoctorFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName} ({d.specialization})
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        {/* Clear Filters */}
        {(search || statusFilter || doctorFilter || dateFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setDoctorFilter('');
              setDateFilter('');
              setCurrentPage(1);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-error rounded-xl hover:bg-error-container/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base">filter_alt_off</span>
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Main Table / List */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadInitialData} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="event_busy"
            title="No appointments found"
            description={
              search || statusFilter || doctorFilter || dateFilter
                ? 'Try adjusting your search criteria or clear active filters.'
                : 'No appointments have been booked yet.'
            }
            actionLabel={hasRole(['ADMIN', 'RECEPTIONIST']) ? 'Book New Appointment' : undefined}
            onAction={openAddModal}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container-high border-b border-surface-variant">
                  <tr>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Code</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Patient</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Doctor</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Schedule</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Reason</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {paginatedAppointments.map((apt) => {
                    const patientName = apt.patient?.fullName || apt.patientName || 'Unknown Patient';
                    const patientCode = apt.patient?.patientCode || '';
                    const doctorName = apt.doctor?.fullName || apt.doctorName || 'Doctor';
                    const doctorSpec = apt.doctor?.specialization || '';

                    return (
                      <tr key={apt.id} className="hover:bg-surface transition-colors">
                        {/* Code */}
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary whitespace-nowrap">
                          {apt.appointmentCode}
                        </td>

                        {/* Patient */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setShowDetail(apt)}
                            className="font-semibold text-on-surface hover:text-primary transition-colors text-left block"
                          >
                            {patientName}
                          </button>
                          {patientCode && (
                            <span className="text-[11px] text-on-surface-variant font-mono">{patientCode}</span>
                          )}
                        </td>

                        {/* Doctor */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <p className="font-semibold text-on-surface text-xs">{doctorName}</p>
                          <p className="text-[11px] text-primary">{doctorSpec}</p>
                        </td>

                        {/* Schedule */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                            <span className="material-symbols-outlined text-sm text-outline">calendar_today</span>
                            <span>{apt.appointmentDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-0.5">
                            <span className="material-symbols-outlined text-sm text-outline">schedule</span>
                            <span>{apt.appointmentTime}</span>
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="px-4 py-3.5 hidden lg:table-cell max-w-xs truncate text-on-surface-variant text-xs">
                          {apt.reason || 'General Consultation'}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={apt.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Quick status dropdown for Doctors/Admin */}
                            <select
                              value={apt.status}
                              onChange={(e) => handleQuickStatusChange(apt, e.target.value)}
                              className="text-xs bg-surface border border-outline-variant rounded-lg px-2 py-1 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                              title="Update Status"
                            >
                              {appointmentStatuses.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => setShowDetail(apt)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                              title="View Details"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>

                            {hasRole(['ADMIN', 'RECEPTIONIST']) && (
                              <button
                                onClick={() => openEditModal(apt)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                                title="Edit Appointment"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                            )}

                            {hasRole(['ADMIN', 'RECEPTIONIST']) && (
                              <button
                                onClick={() => setDeleteConfirm(apt)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors"
                                title="Cancel / Delete"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Book / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title={editAppointment ? 'Edit Appointment' : 'Book New Appointment'}
        subtitle={editAppointment ? `Editing ${editAppointment.appointmentCode}` : 'Schedule a clinical consultation'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Select Patient *
              </label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Choose patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.patientCode} - {p.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Attending Doctor *
              </label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                required
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Choose doctor...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} — {d.specialization} ({d.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Appointment Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Appointment Date *
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                required
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Appointment Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Time Slot *
              </label>
              <select
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                required
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>
                    {ts}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {appointmentStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Reason for Visit
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g. Routine Checkup, Follow-up, Cardiac Consultation"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Clinical Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Clinical Notes / Symptoms
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any preliminary patient complaints or instructions..."
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <span>{editAppointment ? 'Save Changes' : 'Confirm Booking'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Appointment Detail Modal */}
      {showDetail && (
        <Modal
          isOpen={true}
          onClose={() => setShowDetail(null)}
          title={`Appointment Details`}
          subtitle={`Reference Code: ${showDetail.appointmentCode}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Status</p>
                <div className="mt-1">
                  <StatusBadge status={showDetail.status} size="md" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Time Slot</p>
                <p className="text-sm font-bold text-on-surface mt-0.5">{showDetail.appointmentTime}</p>
                <p className="text-xs text-outline">{showDetail.appointmentDate}</p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Patient Details</p>
              <p className="font-bold text-base text-on-surface">
                {showDetail.patient?.fullName || showDetail.patientName}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                ID: {showDetail.patient?.patientCode || 'N/A'} • Phone: {showDetail.patient?.phone || 'N/A'}
              </p>
            </div>

            {/* Doctor Info */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">Doctor Details</p>
              <p className="font-bold text-base text-on-surface">
                {showDetail.doctor?.fullName || showDetail.doctorName}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Specialization: {showDetail.doctor?.specialization || 'General'} • Email: {showDetail.doctor?.email || 'N/A'}
              </p>
            </div>

            {/* Consultation Details */}
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Reason for Visit</p>
                <p className="text-sm text-on-surface mt-1 bg-surface p-3 rounded-lg border border-outline-variant/50">
                  {showDetail.reason || 'Routine Consultation'}
                </p>
              </div>
              {showDetail.notes && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Clinical Notes</p>
                  <p className="text-sm text-on-surface mt-1 bg-surface p-3 rounded-lg border border-outline-variant/50 whitespace-pre-wrap">
                    {showDetail.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Status change actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-surface-variant">
              {['Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleQuickStatusChange(showDetail, st)}
                  disabled={showDetail.status === st}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    showDetail.status === st
                      ? 'bg-surface-container-high text-outline cursor-not-allowed'
                      : 'bg-surface border border-outline-variant text-on-surface hover:bg-primary hover:text-white'
                  }`}
                >
                  Mark {st}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete / Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Cancel Appointment?"
        message={`Are you sure you want to remove appointment ${deleteConfirm?.appointmentCode} for ${deleteConfirm?.patient?.fullName || deleteConfirm?.patientName}?`}
        confirmText="Confirm Delete"
        loading={submitting}
      />
    </div>
  );
};

export default Appointments;
