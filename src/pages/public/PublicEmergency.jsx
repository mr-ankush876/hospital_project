import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';

const PublicEmergency = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <PublicNavbar />

      <div className="bg-rose-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                24/7 Level-1 Emergency Response Center
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Immediate Emergency & Trauma Assistance
              </h1>
              <p className="text-rose-100 text-sm max-w-xl">
                If you or a loved one is experiencing severe chest pain, shortness of breath, severe trauma, or acute neurological symptoms, call our emergency hotline immediately.
              </p>
            </div>

            <div className="bg-white text-rose-900 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-rose-600">emergency</span>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Emergency Hotline</p>
              <a href="tel:+91800999911" className="text-2xl font-black text-rose-700 hover:underline">
                +91 (800) 999-911
              </a>
              <p className="text-[11px] text-on-surface-variant">Instant Dispatch & Triage</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">ambulance</span>
            </div>
            <h3 className="font-bold text-base text-on-surface">Advanced Cardiac Life Support Ambulance</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mobile ICUs equipped with defibrillators, telemetry monitors, and emergency medical technicians on rapid dispatch.
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">vital_signs</span>
            </div>
            <h3 className="font-bold text-base text-on-surface">Acute Stroke & STEMI Cardiac Team</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Door-to-balloon time under 60 minutes for acute myocardial infarction, and rapid thrombolysis for ischemic strokes.
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">bloodtype</span>
            </div>
            <h3 className="font-bold text-base text-on-surface">24/7 Blood Bank & Trauma Surgery</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Immediate cross-matched blood components, uncrossmatched O-negative reserve, and dedicated trauma surgical theaters.
            </p>
          </div>
        </div>

        {/* Location & Directions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold text-on-surface">Emergency Department Location</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Direct ambulance ramp and emergency walk-in entrance are accessible from the East Gate with 24/7 valet stretcher assistance.
              </p>
              <div className="space-y-2 text-xs text-on-surface">
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                  <span><strong>Address:</strong> Medical Center Road, Gate 1 Emergency Entrance, Healthcare City, MH 400001</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">call</span>
                  <span><strong>Direct Desk:</strong> +91 (800) 123-4567 (Ext 101)</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/public-beds"
                className="w-full sm:w-auto text-center bg-surface border border-outline-variant hover:border-primary/40 text-on-surface font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-xs"
              >
                View Live ICU Beds
              </Link>
              <Link
                to="/patient/book-appointment"
                className="w-full sm:w-auto text-center bg-primary text-on-primary font-bold text-xs px-6 py-3.5 rounded-xl hover:bg-primary-container transition-all shadow-xs"
              >
                Book Routine Visit
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
