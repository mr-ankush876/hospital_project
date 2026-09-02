import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import EmergencyActionCard from '../../components/emergency/EmergencyActionCard';
import { EMERGENCY_CONTACTS } from '../../config/emergencyConfig';

const PublicEmergency = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-rose-500/20">
      <PublicNavbar />

      {/* Emergency Alert Hero Header */}
      <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white py-10 sm:py-14 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>Level-1 Acute Trauma & 24/7 Emergency Department</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Emergency & Trauma Center
              </h1>
              <p className="text-rose-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                If you or someone near you is experiencing severe chest pain, acute breathing distress, severe trauma, stroke symptoms, or unconsciousness, connect to our emergency team immediately.
              </p>
            </div>

            {/* Direct Quick Badges */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-200">Trauma Desk Direct</p>
                <p className="text-xl font-black">{EMERGENCY_CONTACTS.hospitalFormatted}</p>
                <p className="text-[11px] text-rose-100">Board-Certified Emergency Doctors On Duty</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200">Local Ambulance</p>
                <p className="text-xl font-black">{EMERGENCY_CONTACTS.ambulanceFormatted}</p>
                <p className="text-[11px] text-rose-100">Paramedics & Mobile ICU Resuscitation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-10">
        {/* Core Emergency Action Card */}
        <EmergencyActionCard />

        {/* 3 Pillars of Emergency Department */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <span className="material-symbols-outlined text-2xl">ambulance</span>
            </div>
            <h3 className="font-bold text-base text-on-surface">Mobile ICU Ambulances</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Equipped with multichannel ECG monitors, portable transport ventilators, external defibrillators, and trained life-support paramedics.
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <span className="material-symbols-outlined text-2xl">ecg_heart</span>
            </div>
            <h3 className="font-bold text-base text-on-surface">Door-To-Balloon STEMI Protocol</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Target reperfusion time under 60 minutes for acute cardiac infarctions with 24/7 dedicated catheterization and angioplasty teams.
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <span className="material-symbols-outlined text-2xl">bloodtype</span>
            </div>
            <h3 className="font-bold text-base text-on-surface">Trauma Surgery & Blood Reserve</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Instant uncrossmatched O-negative blood units ready for massive transfusion protocols and twin emergency surgical operating rooms.
            </p>
          </div>
        </div>

        {/* Location, Access & Directions */}
        <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-sm">directions</span>
                Emergency Arrival & Stretcher Bay
              </div>
              <h2 className="text-2xl font-extrabold text-on-surface">Emergency Department Access</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Direct ambulance bay and pedestrian emergency entrance are accessible from the East Gate with dedicated triage nurse desk and zero-delay stretcher assistance.
              </p>
              <div className="space-y-2.5 text-xs text-on-surface">
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-primary mt-0.5">location_on</span>
                  <span><strong>Physical Address:</strong> Medical Center Road, Gate 1 Emergency Ramp, Healthcare City, MH 400001</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">phone_in_talk</span>
                  <span><strong>Emergency Desk:</strong> {EMERGENCY_CONTACTS.hospitalFormatted} (Ext 101)</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-surface-container-low/40 p-6 rounded-2xl border border-outline-variant/40">
              <Link
                to="/public-beds"
                className="w-full sm:w-auto text-center bg-surface-container-lowest border border-outline-variant hover:border-primary/50 text-on-surface font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-primary">hotel</span>
                <span>Live ICU & Bed Tracker</span>
              </Link>
              <Link
                to="/patient/book-appointment"
                className="w-full sm:w-auto text-center bg-primary text-on-primary font-bold text-xs px-6 py-3.5 rounded-xl hover:bg-primary-container transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">calendar_month</span>
                <span>Book Routine Appointment</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicEmergency;