import React from 'react';

const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest border border-error/30 rounded-xl my-4">
      <div className="w-16 h-16 rounded-2xl bg-error-container/20 flex items-center justify-center text-error mb-4">
        <span className="material-symbols-outlined text-4xl">error_outline</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm text-sm"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
