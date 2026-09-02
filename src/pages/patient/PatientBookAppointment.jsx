import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi, doctorApi, departmentApi, patientPortalApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import {
  isDoctorAvailableOnDate,
  formatFriendlyDate,
  generateDoctorTimeSlots,
  formatDoctorName,
} from '../../utils/doctorSchedule';

const PatientBookAppointment = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [allDoctors, setAllDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('09:00 AM');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const toast = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, depRes] = await Promise.allSettled([
        publicApi.getDoctors().catch(() => doctorApi.getAll()),
        departmentApi.getAll(),
      ]);

      let docList = [];
      if (docRes.status === 'fulfilled' && docRes.value?.data) {
        docList = Array.isArray(docRes.value.data) ? docRes.value.data : docRes.value.data.content || [];
      } else {
        const fallbackRes = await doctorApi.getAll();
        docList = Array.isArray(fallbackRes.data) ? fallbackRes.data : fallbackRes.data?.content || [];
      }

      if (depRes.status === 'fulfilled' && depRes.value?.data) {
        setDepartments(depRes.value.data || []);
      }

      const availableDocs = docList.filter((d) => {
        const s = (d.status || '').toLowerCase();
        return s !== 'inactive' && s !== 'unavailable';
      });

      setAllDoctors(availableDocs);
      setFilteredDoctors(availableDocs);
      if (availableDocs.length > 0) {
        const firstDoc = availableDocs[0];
        setSelectedDoctorId(String(firstDoc.id));
        const initialSlots = generateDoctorTimeSlots(firstDoc.availableTime);
        if (initialSlots.length > 0) {
          setAppointmentTime(initialSlots[0]);
        }
      } else {
        setSelectedDoctorId('');
      }
    } catch (err) {
      console.error('Error fetching booking data:', err);
      setError('Unable to load available attending physicians from the database.');
      toast.error('Failed to retrieve available doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDepartmentChange = (deptName) => {
    setSelectedDepartment(deptName);
    let matched = allDoctors;
    if (deptName !== 'ALL') {
      matched = allDoctors.filter(
        (d) =>
          d.departmentName?.toLowerCase() === deptName.toLowerCase() ||
          d.specialization?.toLowerCase() === deptName.toLowerCase()
      );
    }
    setFilteredDoctors(matched);
    if (matched.length > 0) {
      const nextDoc = matched[0];
      setSelectedDoctorId(String(nextDoc.id));
      const slots = generateDoctorTimeSlots(nextDoc.availableTime);
      if (slots.length > 0) setAppointmentTime(slots[0]);
    } else {
      setSelectedDoctorId('');
    }
  };

  const selectedDoctor = allDoctors.find((d) => String(d.id) === String(selectedDoctorId));

  // Dynamic doctor availability & time slot evaluation
  const isAvailable = selectedDoctor ? isDoctorAvailableOnDate(selectedDoctor, appointmentDate) : false;
  const doctorTimeSlots = selectedDoctor ? generateDoctorTimeSlots(selectedDoctor.availableTime) : [];
  const doctorDisplayName = selectedDoctor ? formatDoctorName(selectedDoctor.fullName) : 'Doctor';
  const friendlySelectedDate = formatFriendlyDate(appointmentDate);

  // Recalculate time slot when doctor or availability changes
  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId);
    const doc = allDoctors.find((d) => String(d.id) === String(docId));
    if (doc) {
      const slots = generateDoctorTimeSlots(doc.availableTime);
      if (slots.length > 0) {
        setAppointmentTime(slots[0]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) {
      toast.error('Please select an attending doctor.');
      return;
    }

    if (!appointmentDate) {
      toast.error('Please choose a valid appointment date.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (appointmentDate < todayStr) {
      toast.error('Cannot book appointments on past dates.');
      return;
    }

    if (!isAvailable) {
      toast.error(`${doctorDisplayName} is not available on ${friendlySelectedDate}.`);
      return;
    }

    if (!appointmentTime) {
      toast.error('Please choose an available appointment time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        doctorId: Number(selectedDoctorId),
        appointmentDate,
        appointmentTime,
        reason: reason.trim() || 'General Medical Consultation',
        notes: notes.trim(),
        status: 'Confirmed',
      };

      const res = await patientPortalApi.bookAppointment(payload);
      toast.success(`Appointment confirmed! Reference Code: ${res.data?.appointmentCode || 'Confirmed'}`);
      navigate('/patient/appointments');
    } catch (err) {
      console.error('Booking error:', err);
      const errorMsg =
        err?.response?.data?.message ||
        'Unable to book appointment. Please check doctor working schedule and try again.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading available attending doctors from database..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  if (allDoctors.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Book Online Consultation</h1>
          <p className="text-xs text-on-surface-variant">
            Schedule an in-person clinical evaluation with our specialist medical faculty.
          </p>
        </div>
        <EmptyState
          icon="medical_services"
          title="No Doctors Available"
          description="There are currently no active doctors available for appointment scheduling. Please try again later."
          actionLabel="Retry Loading"
          onAction={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Book Online Consultation</h1>
        <p className="text-xs text-on-surface-variant">
          Schedule a clinical evaluation with our medical specialists. Doctor schedules and working days are verified in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Department / Specialty Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                1. Select Clinical Department / Specialty
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
              >
                <option value="ALL">All Clinical Specialties</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                2. Select Attending Specialist *
              </label>
              {filteredDoctors.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  No doctors currently registered under this specialty. Please select another department.
                </div>
              ) : (
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
                >
                  {filteredDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fullName} — {doc.specialization} ({doc.availableDays || 'Mon - Fri'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date and Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Consultation Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Available Time Slot *
                </label>
                {isAvailable ? (
                  <select
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
                  >
                    {doctorTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    disabled
                    className="w-full px-3.5 py-2.5 bg-surface-variant/40 border border-outline-variant rounded-xl text-xs text-on-surface-variant opacity-60 cursor-not-allowed font-medium"
                  >
                    <option>No time slots available</option>
                  </select>
                )}
              </div>
            </div>

            {/* Availability Status Banner */}
            {selectedDoctor && (
              <div>
                {isAvailable ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-base text-emerald-600 shrink-0 mt-0.5">check_circle</span>
                    <div>
                      <p className="font-bold text-emerald-900">
                        {doctorDisplayName} is available on {friendlySelectedDate}.
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Consultation hours: <strong>{selectedDoctor.availableTime || '09:00 AM - 05:00 PM'}</strong> ({selectedDoctor.availableDays || 'Mon - Fri'})
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-base text-rose-600 shrink-0 mt-0.5">event_busy</span>
                    <div>
                      <p className="font-bold text-rose-900">
                        {doctorDisplayName} is not available on {friendlySelectedDate}.
                      </p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Configured working days: <strong>{selectedDoctor.availableDays || 'Mon - Fri'}</strong>. Please choose another date or select a different specialist.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Primary Reason for Consultation *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Chest heaviness, routine cardiac review, seasonal cough..."
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Clinical Notes / Symptoms */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Additional Clinical Notes & Symptoms (Optional)
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe onset of symptoms, current medications, or specific concerns..."
                className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !isAvailable}
              className={`w-full font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm ${
                !isAvailable || submitting
                  ? 'bg-surface-variant text-on-surface-variant/60 cursor-not-allowed border border-outline-variant/60 shadow-none'
                  : 'bg-primary text-on-primary hover:bg-primary-container cursor-pointer'
              }`}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : !isAvailable ? (
                <span>Physician Unavailable on Selected Date</span>
              ) : (
                <span>Confirm & Reserve Appointment &rarr;</span>
              )}
            </button>
          </form>
        </div>

        {/* Doctor Summary Sidebar Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-headline-md text-headline-md text-on-surface border-b border-surface-variant pb-3">
              Selected Specialist
            </h3>

            {selectedDoctor ? (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedDoctor.imageUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face'}
                    alt={selectedDoctor.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/60 shadow-xs"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{selectedDoctor.fullName}</h4>
                    <p className="text-primary font-semibold">{selectedDoctor.specialization}</p>
                    <p className="text-on-surface-variant font-mono text-[11px]">{selectedDoctor.doctorCode}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface border border-outline-variant/50 space-y-1.5">
                  <p><strong>Qualification:</strong> {selectedDoctor.qualification || 'MD / MBBS'}</p>
                  <p><strong>Experience:</strong> {selectedDoctor.experience || '10+ Years'}</p>
                  <p><strong>Working Days:</strong> <span className="font-semibold text-primary">{selectedDoctor.availableDays || 'Mon - Fri'}</span></p>
                  <p><strong>Hours:</strong> {selectedDoctor.availableTime || '09:00 AM - 05:00 PM'}</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <span className="font-bold text-on-surface">Consultation Fee</span>
                  <span className="font-extrabold text-sm text-primary">
                    ${selectedDoctor.consultationFee || '100.00'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant">Please select a doctor to view details.</p>
            )}
          </div>

          <div className="p-3 bg-surface rounded-xl border border-outline-variant/40 text-[11px] text-on-surface-variant">
            <p className="flex items-center gap-1 font-semibold text-on-surface mb-1">
              <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
              <span>Dynamic Availability Engine</span>
            </p>
            <p>Schedules and working days are matched dynamically per doctor. Unavailable dates are locked from reservation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBookAppointment;
