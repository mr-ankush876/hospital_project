import React, { useState, useEffect } from 'react';
import { doctorPortalApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/common/Loader';

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await doctorPortalApi.getProfile();
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching doctor profile:', err);
        toast.error('Failed to load doctor profile.');
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
      const res = await doctorPortalApi.updateProfile(profile);
      setProfile(res.data);
      toast.success('Doctor clinical profile updated successfully.');
    } catch (err) {
      console.error('Save profile error:', err);
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading doctor profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Physician Profile & Availability</h1>
        <p className="text-xs text-on-surface-variant">
          Update your public consultation hours, available days, and clinical contact information.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-4 bg-surface rounded-xl border border-outline-variant/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-on-surface-variant block text-[11px] font-bold">Doctor Code</span>
              <span className="font-mono font-extrabold text-primary text-sm">{profile?.doctorCode}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px] font-bold">Specialty</span>
              <span className="font-bold text-on-surface text-sm">{profile?.specialization}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px] font-bold">Department</span>
              <span className="font-bold text-on-surface">{profile?.departmentName || 'General'}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px] font-bold">Current Status</span>
              <span className="font-bold text-emerald-700">{profile?.status || 'Available'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Full Clinical Name *
              </label>
              <input
                type="text"
                required
                value={profile?.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Medical Qualifications & Fellowships *
              </label>
              <input
                type="text"
                required
                value={profile?.qualification || ''}
                onChange={(e) => setProfile({ ...profile, qualification: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Available Working Days *
              </label>
              <input
                type="text"
                required
                value={profile?.availableDays || ''}
                onChange={(e) => setProfile({ ...profile, availableDays: e.target.value })}
                placeholder="e.g. Mon, Wed, Fri"
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Consultation Hours *
              </label>
              <input
                type="text"
                required
                value={profile?.availableTime || ''}
                onChange={(e) => setProfile({ ...profile, availableTime: e.target.value })}
                placeholder="e.g. 09:00 AM - 05:00 PM"
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Consultation Fee ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={profile?.consultationFee || ''}
                onChange={(e) => setProfile({ ...profile, consultationFee: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-bold text-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-surface-variant flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-on-primary font-bold text-xs px-6 py-3 rounded-xl hover:bg-primary-container transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Update Doctor Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfile;
