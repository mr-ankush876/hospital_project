import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VitalSyncLogo from '../common/VitalSyncLogo';
import { publicApi } from '../../services/api';

const PublicFooter = () => {
  const [hospitalInfo, setHospitalInfo] = useState({
    phone: '+91 (800) 123-4567',
    emergencyNumber: '8797254899',
    helpCenterNumber: '+91 (800) 123-4567',
    email: 'care@vitalsync.com',
    address: 'Medical Center Road, Healthcare City, MH 400001'
  });

  useEffect(() => {
    publicApi.getHospitalInfo()
      .then(res => {
        if (res.data) setHospitalInfo(prev => ({ ...prev, ...res.data }));
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-inverse-surface text-on-primary-fixed border-t border-outline/20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-outline/20">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <VitalSyncLogo showText={true} className="w-10 h-10" />
            <p className="text-on-surface-variant text-sm max-w-sm leading-relaxed">
              VitalSync Clinical Precision HMS delivers state-of-the-art diagnostic, surgical, and inpatient medical care with real-time digital integration and patient empowerment.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Emergency Services 24/7 Active
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Public Portal</h4>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li><Link to="/public-doctors" className="hover:text-white transition-colors">Our Doctors</Link></li>
              <li><Link to="/public-departments" className="hover:text-white transition-colors">Departments</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Clinical Services</Link></li>
              <li><Link to="/public-beds" className="hover:text-white transition-colors">ICU & Bed Live Tracker</Link></li>
              <li><Link to="/emergency" className="hover:text-white transition-colors">Emergency Center</Link></li>
            </ul>
          </div>

          {/* Patient Self-Service */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Patient Access</h4>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li><Link to="/login?tab=register" className="hover:text-white transition-colors">New Patient Signup</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Patient Sign In</Link></li>
              <li><Link to="/patient/book-appointment" className="hover:text-white transition-colors">Book Consultation</Link></li>
              <li><Link to="/patient/reports" className="hover:text-white transition-colors">Diagnostic Reports</Link></li>
              <li><Link to="/patient/prescriptions" className="hover:text-white transition-colors">My Prescriptions</Link></li>
            </ul>
          </div>

          {/* Hospital Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact & Support</h4>
            <ul className="space-y-2.5 text-xs text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">call</span>
                <span>{hospitalInfo.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-rose-400">emergency</span>
                <span className="text-rose-300 font-bold">Emergency: {hospitalInfo.emergencyNumber || '8797254899'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-400">support_agent</span>
                <span>Help Center: {hospitalInfo.helpCenterNumber || hospitalInfo.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">mail</span>
                <span>{hospitalInfo.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm text-primary mt-0.5">location_on</span>
                <span>{hospitalInfo.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Subfooter */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-outline-variant">
          <p>© {new Date().getFullYear()} VitalSync HMS. All Rights Reserved. ISO 27001 & HIPAA Compliant Healthcare System.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-white transition-colors">Hospital Staff Portal</Link>
            <span>•</span>
            <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/" className="hover:text-white transition-colors">Terms of Care</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
