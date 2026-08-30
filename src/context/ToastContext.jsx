import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const typeConfig = {
    success: {
      border: 'border-l-emerald-500',
      icon: 'check_circle',
      iconColor: 'text-emerald-600',
      title: 'Success',
      bg: 'bg-surface-container-lowest',
    },
    error: {
      border: 'border-l-error',
      icon: 'error',
      iconColor: 'text-error',
      title: 'Error',
      bg: 'bg-surface-container-lowest',
    },
    warning: {
      border: 'border-l-amber-500',
      icon: 'warning',
      iconColor: 'text-amber-600',
      title: 'Warning',
      bg: 'bg-surface-container-lowest',
    },
    info: {
      border: 'border-l-primary',
      icon: 'info',
      iconColor: 'text-primary',
      title: 'Information',
      bg: 'bg-surface-container-lowest',
    },
  };

  return (
    <div
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const config = typeConfig[toast.type] || typeConfig.info;
        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-outline-variant border-l-4 ${config.border} ${config.bg} shadow-lg text-on-surface transition-all duration-300 transform translate-y-0 opacity-100 animate-slide-in`}
          >
            <span className={`material-symbols-outlined text-xl ${config.iconColor} shrink-0 mt-0.5`}>
              {config.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">{config.title}</p>
              <p className="text-sm font-medium text-on-surface break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
              aria-label="Close notification"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
