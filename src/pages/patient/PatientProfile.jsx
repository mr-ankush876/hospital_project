import React, { useState, useEffect } from 'react';
import { patientPortalApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';
import PhoneNumberInput from '../../components/common/PhoneNumberInput';

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await patientPortalApi.getProfile();
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching patient profile:', err);
        toast.error('Failed to load personal profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await patientPortalApi.updateProfile(profile);
      setProfile(res.data);
      toast.success('Patient profile updated successfully.');
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading personal health profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Personal Health Profile</h1>
        <p className="text-xs text-on-surface-variant">
          Manage your emergency contacts, address, documented allergies, and medical history.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity & Read-Only Specs */}
          <div className="p-4 bg-surface rounded-xl border border-outline-variant/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-on-surface-variant block text-[11px] font-bold">Patient Code</span>
              <span className="font-mono font-extrabold text-primary text-sm">{profile?.patientCode}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px] font-bold">Full Name</span>
              <span className="font-bold text-on-surface text-sm">{profile?.fullName}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px] font-bold">Gender & Blood Group</span>
              <span className="font-bold text-on-surface">{profile?.gender} • {profile?.bloodGroup}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px] font-bold">Age & Date of Birth</span>
              <span className="font-bold text-on-surface">{profile?.age} Yrs ({profile?.dob})</span>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <PhoneNumberInput
                label="Primary Phone Number"
                required
                value={profile?.phone || ''}
                onChange={(val) => setProfile({ ...profile, phone: val })}
              />
            </div>

            <div>
              <PhoneNumberInput
                label="Emergency Contact Phone"
                required
                value={profile?.emergencyContact || ''}
                onChange={(val) => setProfile({ ...profile, emergencyContact: val })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Residential Address
            </label>
            <input
              type="text"
              value={profile?.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Known Drug & Food Allergies
              </label>
              <textarea
                rows="3"
                value={profile?.allergies || ''}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Sulfa, Peanuts, Latex..."
                className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Past Medical History & Chronic Conditions
              </label>
              <textarea
                rows="3"
                value={profile?.medicalHistory || ''}
                onChange={(e) => setProfile({ ...profile, medicalHistory: e.target.value })}
                placeholder="e.g. Hypertension, Type 2 Diabetes, Past knee surgery..."
                className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-surface-variant flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-on-primary font-bold text-xs px-6 py-3 rounded-xl hover:bg-primary-container transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientProfile;
