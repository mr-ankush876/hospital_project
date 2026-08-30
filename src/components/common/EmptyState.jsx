import React from 'react';

const EmptyState = ({
  icon = 'inbox',
  title = 'No records found',
  description = 'There are no items matching your criteria.',
  actionLabel,
  onAction,
  actionIcon = 'add',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest border border-outline-variant rounded-xl my-4">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-outline mb-4 shadow-inner">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-5 py-2.5 rounded-lg hover:bg-primary-container transition-colors shadow-sm text-sm"
        >
          <span className="material-symbols-outlined text-base">{actionIcon}</span>
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
