import React, { useState, useEffect } from 'react';
import { EMERGENCY_CONTACTS } from '../../config/emergencyConfig';
import { emergencyApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const EmergencyActionCard = ({ user = null, onRequestCreated = null, compact = false }) => {
  const { addToast } = useToast();
  const [activeCallInstruction, setActiveCallInstruction] = useState(null);
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [submittingInfo, setSubmittingInfo] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);

  // Quick triage form state
  const [formData, setFormData] = useState({
    patientName: user?.fullName || '',
    contactNumber: user?.phone || '',
    emergencyType: 'Accident',
    location: '',
    peopleAffected: 1,
    description: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        patientName: prev.patientName || user.fullName || '',
        contactNumber: prev.contactNumber || user.phone || '',
      }));
    }
  }, [user]);

  const copyToClipboard = (number, label) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(number);
      setCopiedNumber(number);
      addToast(`${label} number (${number}) copied to clipboard`, 'success');
      setTimeout(() => setCopiedNumber(null), 3000);
    } else {
      setCopiedNumber(number);
      addToast(`Number: ${number}`, 'info');
    }
  };

  const handleInitiateCall = async (type) => {
    const isAmbulance = type === 'ambulance';
    const targetNumber = isAmbulance ? EMERGENCY_CONTACTS.ambulance : EMERGENCY_CONTACTS.hospital;
    const targetUri = isAmbulance ? EMERGENCY_CONTACTS.ambulanceTelUri : EMERGENCY_CONTACTS.hospitalTelUri;

    setActiveCallInstruction({
      type,
      number: targetNumber,
      title: isAmbulance ? 'Opening Ambulance Call...' : 'Opening Hospital Emergency Call...',
      instruction: isAmbulance
        ? 'Please tell the ambulance operator your emergency condition and current location.'
        : 'Please explain what happened and provide your current location to the emergency staff.',
    });

    // 1. Immediately trigger native telephone dialer
    // We do this without waiting for database response so calling is NEVER blocked
    try {
      window.location.href = targetUri;
    } catch (e) {
      console.warn('Native dialer redirect attempted:', e);
    }

    // 2. Persist call initiation in database
    try {
      if (currentRequest && currentRequest.id) {
        // Update existing emergency request with call initiation timestamp
        const res = isAmbulance
          ? await emergencyApi.recordAmbulanceCall(currentRequest.id)
          : await emergencyApi.recordHospitalCall(currentRequest.id);

        if (res.data) {
          setCurrentRequest(res.data);
          if (onRequestCreated) onRequestCreated(res.data);
        }
      } else {
        // Create emergency request with call type
        const payload = {
          patientName: formData.patientName || user?.fullName || 'Emergency Caller',
          contactNumber: formData.contactNumber || user?.phone || targetNumber,
          emergencyType: formData.emergencyType || 'Urgent Medical Emergency',
          location: formData.location || 'Verbal on phone',
          peopleAffected: parseInt(formData.peopleAffected, 10) || 1,
          description: formData.description || `Immediate ${isAmbulance ? 'Ambulance' : 'Hospital Emergency'} call initiated.`,
          contactMethod: isAmbulance ? 'AMBULANCE' : 'HOSPITAL_EMERGENCY',
        };

        const res = await emergencyApi.create(payload);
        if (res.data) {
          setCurrentRequest(res.data);
          if (onRequestCreated) onRequestCreated(res.data);
        }
      }
    } catch (err) {
      // If logging fails, warn but never block the call!
      console.warn('Emergency record could not be saved. Direct call remains active:', err);
      addToast(
        'Emergency record could not be saved to server. Please dial the emergency number directly.',
        'warning'
      );
    }
  };

  const handleCreateRequestOnly = async (e) => {
    e.preventDefault();
    if (!formData.contactNumber || !formData.emergencyType) {
      addToast('Please enter your contact number and emergency type', 'warning');
      return;
    }

    setSubmittingInfo(true);
    try {
      const payload = {
        patientName: formData.patientName || user?.fullName || 'Emergency Caller',
        contactNumber: formData.contactNumber,
        emergencyType: formData.emergencyType,
        location: formData.location || 'Not provided',
        peopleAffected: parseInt(formData.peopleAffected, 10) || 1,
        description: formData.description || 'Emergency alert created by patient.',
        contactMethod: 'MANUAL_REQUEST',
        status: 'REQUESTED',
      };

      const res = await emergencyApi.create(payload);
      setCurrentRequest(res.data);
      addToast(`Emergency Request Created (${res.data.requestCode}) in MySQL. Click Call to connect.`, 'success');
      setShowInfoForm(false);
      if (onRequestCreated) {
        onRequestCreated(res.data);
      }
    } catch (err) {
      console.error('Error creating emergency request:', err);
      addToast(
        err?.response?.data?.message ||
          'Emergency record could not be saved. Please call the emergency number directly.',
        'error'
      );
    } finally {
      setSubmittingInfo(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border-2 border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
      {/* Visual Emergency Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/60">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <span className="material-symbols-outlined text-3xl animate-pulse">e911_emergency</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                24/7 Priority Emergency
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-on-surface mt-1">
              Immediate Medical Emergency Assistance
            </h2>
          </div>
        </div>

        <div className="text-xs text-on-surface-variant font-medium bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/40">
          <span className="text-rose-600 font-bold">Clinical Rule:</span> Calling is immediate â€” form is optional.
        </div>
      </div>

      {/* Active Call Feedback Banner */}
      {activeCallInstruction && (
        <div className="my-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl mt-0.5">ring_volume</span>
            <div>
              <p className="font-extrabold text-sm text-amber-900">{activeCallInstruction.title}</p>
              <p className="text-xs text-amber-800 mt-0.5">{activeCallInstruction.instruction}</p>
              <p className="text-[11px] text-amber-700 mt-1">
                Dialing: <strong>{activeCallInstruction.number}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveCallInstruction(null)}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Emergency Request Banner (if request exists) */}
      {currentRequest && (
        <div className="my-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-rose-600 text-2xl">verified</span>
            <div>
              <p className="text-xs font-bold text-rose-900">
                Active Emergency Request: <span className="font-mono text-sm font-black">{currentRequest.requestCode}</span>
              </p>
              <p className="text-[11px] text-rose-800 mt-0.5">
                Type: <strong>{currentRequest.emergencyType}</strong> â€¢ Status: <strong className="uppercase">{currentRequest.status}</strong>
                {currentRequest.emergencyCallInitiatedAt && ' â€¢ Hospital Call: Initiated'}
                {currentRequest.ambulanceCallInitiatedAt && ' â€¢ Ambulance Call: Initiated'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg bg-rose-600 text-white shrink-0">
            Recorded in MySQL
          </span>
        </div>
      )}

      {/* Primary Emergency Action Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* Call Hospital Emergency Button */}
        <div className="bg-rose-50/70 border-2 border-rose-500 rounded-2xl p-5 flex flex-col justify-between hover:bg-rose-50 transition-colors shadow-sm">
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">local_hospital</span>
                Hospital Trauma Center
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(EMERGENCY_CONTACTS.hospital, 'Hospital')}
                className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 px-2 py-1 rounded bg-white/80 border border-rose-200"
                title="Copy phone number"
              >
                <span className="material-symbols-outlined text-xs">
                  {copiedNumber === EMERGENCY_CONTACTS.hospital ? 'check' : 'content_copy'}
                </span>
                <span>{copiedNumber === EMERGENCY_CONTACTS.hospital ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-2xl font-black text-rose-900 tracking-tight">
              {EMERGENCY_CONTACTS.hospitalFormatted}
            </p>
            <p className="text-xs text-rose-700/80">
              Direct Level-1 Trauma Hotline, Acute Resuscitation & Emergency Physicians.
            </p>
          </div>

          <a
            href={EMERGENCY_CONTACTS.hospitalTelUri}
            onClick={() => handleInitiateCall('hospital')}
            className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-sm sm:text-base py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-rose-400"
            aria-label={`Call Hospital Emergency at ${EMERGENCY_CONTACTS.hospital}`}
          >
            <span className="material-symbols-outlined text-2xl">call</span>
            <span>CALL HOSPITAL EMERGENCY</span>
          </a>
        </div>

        {/* Call Ambulance Button */}
        <div className="bg-amber-50/70 border-2 border-amber-500 rounded-2xl p-5 flex flex-col justify-between hover:bg-amber-50 transition-colors shadow-sm">
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">ambulance</span>
                Local Ambulance Dispatch
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(EMERGENCY_CONTACTS.ambulance, 'Ambulance')}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 px-2 py-1 rounded bg-white/80 border border-amber-200"
                title="Copy phone number"
              >
                <span className="material-symbols-outlined text-xs">
                  {copiedNumber === EMERGENCY_CONTACTS.ambulance ? 'check' : 'content_copy'}
                </span>
                <span>{copiedNumber === EMERGENCY_CONTACTS.ambulance ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-2xl font-black text-amber-950 tracking-tight">
              {EMERGENCY_CONTACTS.ambulanceFormatted}
            </p>
            <p className="text-xs text-amber-800/80">
              Rapid-dispatch Mobile ICU, paramedic crew, oxygen and emergency transport.
            </p>
          </div>

          <a
            href={EMERGENCY_CONTACTS.ambulanceTelUri}
            onClick={() => handleInitiateCall('ambulance')}
            className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-sm sm:text-base py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-amber-400"
            aria-label={`Call Ambulance at ${EMERGENCY_CONTACTS.ambulance}`}
          >
            <span className="material-symbols-outlined text-2xl">emergency</span>
            <span>CALL AMBULANCE</span>
          </a>
        </div>
      </div>

      {/* Desktop & Device Fallback Notice */}
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4 text-xs text-on-surface-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-base text-primary">info</span>
          <span>
            <strong>Desktop / Dialer Fallback:</strong> If your browser does not open a phone dialer, dial directly on any phone:
            {' '}
            <strong className="text-rose-600">{EMERGENCY_CONTACTS.hospital}</strong> (Hospital) or{' '}
            <strong className="text-amber-600">{EMERGENCY_CONTACTS.ambulance}</strong> (Ambulance).
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowInfoForm(!showInfoForm)}
            className="text-primary font-bold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            <span>{showInfoForm ? 'Hide Details Form' : 'Describe Emergency / Create Request'}</span>
          </button>
        </div>
      </div>

      {/* Verbal Guidance: "If You Can Speak" */}
      <div className="mt-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 text-xs space-y-2">
        <p className="font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-emerald-600">record_voice_over</span>
          <span>When speaking to the emergency responder, tell them:</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-on-surface-variant">
          <div className="flex items-center gap-1.5 bg-surface-container-low/50 px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>1. What happened</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-low/50 px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>2. Patient condition</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-low/50 px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>3. Current location</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-low/50 px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>4. People affected</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-low/50 px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>5. Immediate danger</span>
          </div>
        </div>
      </div>

      {/* Optional Information Capture Form */}
      {showInfoForm && (
        <form
          onSubmit={handleCreateRequestOnly}
          className="mt-6 p-6 rounded-2xl bg-surface-container-low border border-outline-variant space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-outline-variant pb-3">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">clinical_notes</span>
              <span>Emergency Request Details</span>
            </h3>
            <span className="text-[11px] text-on-surface-variant">Persisted directly in MySQL database</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Patient / Caller Name
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Callback Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="e.g. 8797254899"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Emergency Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.emergencyType}
                onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Accident">Accident / Roadside Trauma</option>
                <option value="Severe Chest Pain">Severe Chest Pain / Heart Condition</option>
                <option value="Breathing Difficulty">Breathing Difficulty / Asthma Attack</option>
                <option value="Severe Bleeding">Severe Bleeding / Deep Wound</option>
                <option value="Unconscious Person">Unconscious Person / Syncope</option>
                <option value="Stroke Symptoms">Stroke Symptoms / Sudden Weakness</option>
                <option value="Severe Burn / Chemical">Severe Burn / Chemical Exposure</option>
                <option value="Other Acute Emergency">Other Acute Emergency</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Current Location (Exact landmarks, Gate, Room or Address)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Near East Gate entrance, Sector 4, Flat 302"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Number of People Affected
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.peopleAffected}
                onChange={(e) => setFormData({ ...formData, peopleAffected: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Description of Emergency
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Demo emergency: patient met with an accident and needs urgent medical assistance."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowInfoForm(false)}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingInfo}
              className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>{submittingInfo ? 'Saving to Database...' : 'Create Emergency Request'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EmergencyActionCard;