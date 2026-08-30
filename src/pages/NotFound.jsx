import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant p-8 rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-container-high text-primary flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl">search_off</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Page Not Found (404)</h1>
        <p className="font-body-md text-on-surface-variant mb-6 text-sm leading-relaxed">
          The page or clinical resource you are trying to access does not exist or has been relocated.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-6 py-2.5 rounded-lg hover:bg-primary-container transition-colors text-sm shadow-sm"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
