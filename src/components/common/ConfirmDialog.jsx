import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  loading = false,
  icon = 'warning',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showClose={!loading}>
      <div className="text-center py-2">
        <div
          className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
            isDanger ? 'bg-error-container/20 text-error' : 'bg-primary/10 text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{title}</h3>
        <p className="font-body-md text-sm text-on-surface-variant mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-lg border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 ${
              isDanger
                ? 'bg-error text-on-error hover:bg-error/90'
                : 'bg-primary text-on-primary hover:bg-primary-container'
            }`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
