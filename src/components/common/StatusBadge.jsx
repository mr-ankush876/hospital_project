import React from 'react';

const statusStyles = {
  // Common Active / Inactive
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',

  // Doctor statuses
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Surgery': 'bg-sky-50 text-sky-700 border-sky-200',
  'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
  Unavailable: 'bg-slate-100 text-slate-600 border-slate-200',

  // Appointment statuses
  Scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Urgent: 'bg-rose-50 text-rose-700 border-rose-200',
  Completed: 'bg-slate-100 text-slate-700 border-slate-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',

  // Bill / Payment statuses
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'Partially Paid': 'bg-indigo-50 text-indigo-700 border-indigo-200',

  // Roles
  ADMIN: 'bg-primary/10 text-primary border-primary/20',
  DOCTOR: 'bg-purple-50 text-purple-700 border-purple-200',
  RECEPTIONIST: 'bg-teal-50 text-teal-700 border-teal-200',
};

const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  if (!status) return null;

  const style = statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.2 text-[10px]'
      : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${style} ${sizeClasses} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
