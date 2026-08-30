import React from 'react';

const VitalSyncLogo = ({ className = "w-8 h-8", textClassName = "text-on-primary-fixed", showText = false, size = "md" }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`${className} rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-sm text-white relative overflow-hidden flex-shrink-0`}>
        {/* Geometric Medical Cross + Pulse Graphic */}
        <svg viewBox="0 0 24 24" className="w-5/6 h-5/6 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-6v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-6H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h6V3z" opacity="0.9" />
          <circle cx="12" cy="12" r="3" fill="#93ccff" />
        </svg>
      </div>
      {showText && (
        <div className="leading-tight">
          <h1 className={`font-headline-md text-headline-md font-bold ${textClassName}`}>
            VitalSync HMS
          </h1>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[10px] opacity-80">
            Clinical Precision
          </p>
        </div>
      )}
    </div>
  );
};

export default VitalSyncLogo;
