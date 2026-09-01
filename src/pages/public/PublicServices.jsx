import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';

const PublicServices = () => {
  const services = [
    {
      icon: 'vital_signs',
      title: 'Cardiac Interventions & Diagnostics',
      desc: 'Coronary angiography, dynamic echocardiography, Holter monitoring, and invasive catheterization laboratories.',
      badge: 'Advanced Cardiology',
    },
    {
      icon: 'neurology',
      title: 'Neurological & Neurosurgical Care',
      desc: 'Comprehensive stroke management, epilepsy monitoring, spinal surgery, and neuro-oncology consultations.',
      badge: 'Neurosciences',
    },
    {
      icon: 'pediatrics',
      title: 'Pediatric & Neonatal Intensive Care',
      desc: 'Level-3 NICU units, routine pediatric development evaluations, adolescent medicine, and immunization schedules.',
      badge: 'Pediatrics',
    },
    {
      icon: 'local_hospital',
      title: '24/7 Acute Emergency & Trauma',
      desc: 'Rapid triage response bays, emergency resuscitation, on-site trauma surgeons, and advanced cardiac life support.',
      badge: 'Critical Care',
    },
    {
      icon: 'biotech',
      title: 'Automated Pathology & Diagnostic Labs',
      desc: 'High-throughput biochemistry, digital hematology, PCR infectious disease panels, and rapid report generation.',
      badge: 'Diagnostics',
    },
    {
      icon: 'radiology',
      title: 'Medical Imaging & Radiology',
      desc: 'High-resolution 3T MRI, 128-slice dual-source CT scanning, digital fluoroscopy, and ultrasound imaging.',
      badge: 'Imaging',
    },
    {
      icon: 'medication',
      title: 'Inpatient & Outpatient Pharmacy',
      desc: 'Automated unit-dose dispensing, pharmacist clinical consultations, and 24/7 formulary availability.',
      badge: 'Pharmacy',
    },
    {
      icon: 'hotel',
      title: 'Intensive Care Unit (ICU) & Step-down',
      desc: 'Central hemodynamic monitoring, modern mechanical ventilation, isolation negative-pressure rooms, and 1:1 nursing.',
      badge: 'ICU Facilities',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <PublicNavbar />

      <div className="bg-surface-container-low/40 border-b border-outline-variant/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-3">
              <span className="material-symbols-outlined text-sm">health_and_safety</span>
              Clinical Healthcare Services
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface">Precision Medical Services</h1>
            <p className="text-sm text-on-surface-variant mt-2">
              VitalSync Multi-Specialty Hospital offers comprehensive clinical, surgical, diagnostic, and emergency healthcare facilities.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/20">
                    {s.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base text-on-surface leading-snug">{s.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{s.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-surface-variant">
                <Link
                  to="/patient/book-appointment"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Book for this service</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicServices;
