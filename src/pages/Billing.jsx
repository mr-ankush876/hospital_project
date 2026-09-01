import React, { useState, useEffect } from 'react';
import { billApi, patientApi, doctorApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { TableSkeleton } from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import VitalSyncLogo from '../components/common/VitalSyncLogo';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

const Billing = () => {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals & States
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [printTarget, setPrintTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    billDate: new Date().toISOString().split('T')[0],
    consultationFee: 500,
    medicineCharges: 0,
    otherCharges: 0,
    discount: 0,
    tax: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
  });

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Insurance', 'Net Banking'];
  const paymentStatuses = ['Pending', 'Paid', 'Partially Paid', 'Cancelled'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, pRes, dRes] = await Promise.all([
        billApi.getAll(),
        patientApi.getAll(),
        doctorApi.getAll(),
      ]);

      setBills(Array.isArray(bRes.data) ? bRes.data : bRes.data?.content || []);
      setPatients(Array.isArray(pRes.data) ? pRes.data : pRes.data?.content || []);
      setDoctors(Array.isArray(dRes.data) ? dRes.data : dRes.data?.content || []);
    } catch (err) {
      console.error('Failed to load billing records:', err);
      setError('Unable to load hospital billing data from the server.');
      toast.error('Failed to load billing records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBills();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, dateFilter]);

  const fetchBills = async () => {
    try {
      const res = await billApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        date: dateFilter || undefined,
      });
      setBills(Array.isArray(res.data) ? res.data : res.data?.content || []);
    } catch (err) {
      console.error('Failed to refresh bills:', err);
    }
  };

  // Calculations for live preview
  const subtotal =
    (Number(formData.consultationFee) || 0) +
    (Number(formData.medicineCharges) || 0) +
    (Number(formData.otherCharges) || 0);
  const taxableAmount = Math.max(0, subtotal - (Number(formData.discount) || 0));
  const totalAmount = taxableAmount + (Number(formData.tax) || 0);

  // Filter
  const filtered = bills;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedBills = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAddModal = () => {
    setFormData({
      patientId: patients.length > 0 ? patients[0].id : '',
      doctorId: doctors.length > 0 ? doctors[0].id : '',
      billDate: new Date().toISOString().split('T')[0],
      consultationFee: 500,
      medicineCharges: 250,
      otherCharges: 0,
      discount: 0,
      tax: 0,
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast.warning('Please select a patient.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await billApi.create(formData);
      toast.success(`Invoice ${res.data?.billCode || ''} created successfully.`);
      setShowModal(false);
      await fetchBills();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create invoice.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (bill, status, method) => {
    try {
      await billApi.updateStatus(bill.id, status, method || bill.paymentMethod);
      toast.success(`Invoice ${bill.billCode} updated to ${status}.`);
      await fetchBills();
      if (showDetail && showDetail.id === bill.id) {
        setShowDetail((prev) => ({ ...prev, paymentStatus: status }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update payment status.';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try {
      await billApi.delete(deleteConfirm.id);
      toast.success(`Invoice ${deleteConfirm.billCode} deleted.`);
      setDeleteConfirm(null);
      await fetchBills();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete invoice.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (bill) => {
    setPrintTarget(bill);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Status Metrics
  const totalRevenue = bills
    .filter((b) => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const pendingAmount = bills
    .filter((b) => b.paymentStatus === 'Pending')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Billing & Invoices</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Patient invoices, fee calculation, and payment transactions.
          </p>
        </div>
        {hasRole(['ADMIN', 'RECEPTIONIST']) && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            <span>Create Invoice</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Collected Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            </div>
          </div>
          <p className="font-stats-lg text-stats-lg text-emerald-700">{formatINR(totalRevenue)}</p>
          <p className="text-xs text-on-surface-variant mt-1">From fully paid invoices</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Pending Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">pending_actions</span>
            </div>
          </div>
          <p className="font-stats-lg text-stats-lg text-amber-700">{formatINR(pendingAmount)}</p>
          <p className="text-xs text-on-surface-variant mt-1">Awaiting patient payment</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Invoices</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">description</span>
            </div>
          </div>
          <p className="font-stats-lg text-stats-lg text-on-surface">{bills.length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Recorded in clinical database</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search invoice code, patient name, method..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="">All Payment Statuses</option>
          {paymentStatuses.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No invoices found"
            description={
              search || statusFilter || dateFilter
                ? 'Try adjusting your search criteria or reset filters.'
                : 'No patient invoices have been generated yet.'
            }
            actionLabel={hasRole(['ADMIN', 'RECEPTIONIST']) ? 'Generate First Invoice' : undefined}
            onAction={openAddModal}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container-high border-b border-surface-variant">
                  <tr>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Invoice Code</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Patient</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Date</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Total (₹)</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Method</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {paginatedBills.map((b) => {
                    const patientName = b.patient?.fullName || b.patientName || 'Patient';
                    const patientCode = b.patient?.patientCode || '';

                    return (
                      <tr key={b.id} className="hover:bg-surface transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary whitespace-nowrap">
                          {b.billCode}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setShowDetail(b)}
                            className="font-semibold text-on-surface hover:text-primary transition-colors text-left block"
                          >
                            {patientName}
                          </button>
                          {patientCode && (
                            <span className="text-[11px] text-on-surface-variant font-mono">{patientCode}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant whitespace-nowrap hidden md:table-cell">
                          {b.billDate}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-on-surface whitespace-nowrap">
                          {formatINR(b.totalAmount)}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant whitespace-nowrap hidden lg:table-cell">
                          {b.paymentMethod || 'Cash'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={b.paymentStatus} size="sm" />
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Mark as paid button for pending bills */}
                            {b.paymentStatus === 'Pending' && hasRole(['ADMIN', 'RECEPTIONIST']) && (
                              <button
                                onClick={() => handleUpdateStatus(b, 'Paid')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
                                title="Mark as Paid"
                              >
                                Mark Paid
                              </button>
                            )}

                            <button
                              onClick={() => handlePrint(b)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                              title="Print Invoice"
                            >
                              <span className="material-symbols-outlined text-lg">print</span>
                            </button>

                            <button
                              onClick={() => setShowDetail(b)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                              title="View Invoice"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>

                            {hasRole(['ADMIN']) && (
                              <button
                                onClick={() => setDeleteConfirm(b)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title="Generate Patient Invoice"
        subtitle="Calculated automatically by VitalSync billing engine"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Select Patient *
              </label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Choose Patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.patientCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Consulting Doctor (Optional)
              </label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">None / General</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            {/* Bill Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                required
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Charges Breakup */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Consultation Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Medicine / Pharmacy Charges (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.medicineCharges}
                onChange={(e) => setFormData({ ...formData, medicineCharges: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Other / Lab Charges (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.otherCharges}
                onChange={(e) => setFormData({ ...formData, otherCharges: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Tax / GST (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Payment Status
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {paymentStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Calculation Summary Banner */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Discount applied:</span>
              <span className="font-semibold text-rose-600">- {formatINR(formData.discount)}</span>
            </div>
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Tax / GST:</span>
              <span className="font-semibold">+ {formatINR(formData.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-on-surface pt-2 border-t border-surface-variant">
              <span>Total Payable Amount:</span>
              <span className="text-primary font-stats-lg text-xl">{formatINR(totalAmount)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <span>Generate Invoice</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Detail Modal */}
      {showDetail && (
        <Modal
          isOpen={true}
          onClose={() => setShowDetail(null)}
          title={`Hospital Invoice Details`}
          subtitle={`Invoice Reference: ${showDetail.billCode}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 rounded-xl bg-surface border border-outline-variant">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Patient</p>
                <p className="font-bold text-base text-on-surface mt-0.5">{showDetail.patient?.fullName || showDetail.patientName}</p>
                <p className="text-xs text-on-surface-variant">{showDetail.patient?.patientCode} • Phone: {showDetail.patient?.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Payment Status</p>
                <div className="mt-1">
                  <StatusBadge status={showDetail.paymentStatus} size="sm" />
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-outline-variant rounded-xl overflow-hidden divide-y divide-surface-variant">
              <div className="p-3 bg-surface-container-high font-bold text-xs uppercase tracking-wider text-on-surface-variant flex justify-between">
                <span>Description</span>
                <span>Amount (₹)</span>
              </div>
              <div className="p-3 bg-surface-container-lowest flex justify-between text-sm">
                <span>Consultation Fee</span>
                <span className="font-mono">{formatINR(showDetail.consultationFee)}</span>
              </div>
              <div className="p-3 bg-surface-container-lowest flex justify-between text-sm">
                <span>Pharmacy & Medicines</span>
                <span className="font-mono">{formatINR(showDetail.medicineCharges)}</span>
              </div>
              {Number(showDetail.otherCharges) > 0 && (
                <div className="p-3 bg-surface-container-lowest flex justify-between text-sm">
                  <span>Other / Lab Services</span>
                  <span className="font-mono">{formatINR(showDetail.otherCharges)}</span>
                </div>
              )}
              {Number(showDetail.discount) > 0 && (
                <div className="p-3 bg-surface-container-lowest flex justify-between text-sm text-rose-600">
                  <span>Discount</span>
                  <span className="font-mono">- {formatINR(showDetail.discount)}</span>
                </div>
              )}
              {Number(showDetail.tax) > 0 && (
                <div className="p-3 bg-surface-container-lowest flex justify-between text-sm">
                  <span>Tax (GST)</span>
                  <span className="font-mono">+ {formatINR(showDetail.tax)}</span>
                </div>
              )}
              <div className="p-4 bg-surface flex justify-between text-base font-bold text-on-surface">
                <span>Total Amount:</span>
                <span className="font-stats-lg text-primary text-xl font-mono">{formatINR(showDetail.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs p-3 rounded-xl bg-surface border border-outline-variant">
              <div>
                <p className="text-outline uppercase font-semibold">Payment Method</p>
                <p className="font-bold text-sm text-on-surface mt-0.5">{showDetail.paymentMethod || 'Cash'}</p>
              </div>
              <div>
                <p className="text-outline uppercase font-semibold">Invoice Date</p>
                <p className="font-bold text-sm text-on-surface mt-0.5">{showDetail.billDate}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant">
              <button
                onClick={() => handlePrint(showDetail)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-base">print</span>
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Invoice?"
        message={`Are you sure you want to delete invoice ${deleteConfirm?.billCode}? This will permanently remove the record.`}
        confirmText="Delete Invoice"
        loading={submitting}
      />

      {/* Hidden Printable Area for Invoice */}
      {printTarget && (
        <div className="hidden print:block printable-area p-8 max-w-3xl mx-auto bg-white text-black font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-6">
            <div className="flex items-center gap-3">
              <VitalSyncLogo className="w-12 h-12" showText={true} />
            </div>
            <div className="text-right text-xs">
              <h2 className="text-base font-bold text-primary">TAX INVOICE</h2>
              <p className="font-bold">VitalSync Multi-Specialty Hospital</p>
              <p>Healthcare Complex, MG Road</p>
              <p>GSTIN: 27AAAAA0000A1Z5</p>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded mb-6 text-xs border border-gray-200">
            <div>
              <p className="text-gray-500 uppercase font-semibold">Billed To (Patient):</p>
              <p className="font-bold text-sm mt-0.5">{printTarget.patient?.fullName || printTarget.patientName}</p>
              <p>Patient ID: {printTarget.patient?.patientCode}</p>
              <p>Phone: {printTarget.patient?.phone}</p>
              <p>Address: {printTarget.patient?.address || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 uppercase font-semibold">Invoice Details:</p>
              <p className="font-bold text-sm mt-0.5">#{printTarget.billCode}</p>
              <p>Date: {printTarget.billDate}</p>
              <p>Payment Method: {printTarget.paymentMethod || 'Cash'}</p>
              <p>Status: <strong className="uppercase">{printTarget.paymentStatus}</strong></p>
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full border-collapse border border-gray-300 text-xs mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2.5 text-left">#</th>
                <th className="border border-gray-300 p-2.5 text-left">Item Description</th>
                <th className="border border-gray-300 p-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 p-2.5 font-mono">1</td>
                <td className="border border-gray-300 p-2.5">
                  Consultation Fee ({printTarget.doctor?.fullName || 'Attending Physician'})
                </td>
                <td className="border border-gray-300 p-2.5 text-right font-mono">
                  {formatINR(printTarget.consultationFee)}
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 p-2.5 font-mono">2</td>
                <td className="border border-gray-300 p-2.5">Pharmacy / Medicines Charges</td>
                <td className="border border-gray-300 p-2.5 text-right font-mono">
                  {formatINR(printTarget.medicineCharges)}
                </td>
              </tr>
              {Number(printTarget.otherCharges) > 0 && (
                <tr className="border border-gray-300">
                  <td className="border border-gray-300 p-2.5 font-mono">3</td>
                  <td className="border border-gray-300 p-2.5">Diagnostics / Lab / Other Charges</td>
                  <td className="border border-gray-300 p-2.5 text-right font-mono">
                    {formatINR(printTarget.otherCharges)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Financial summary */}
          <div className="flex justify-end mb-12">
            <div className="w-64 space-y-1.5 text-xs border border-gray-300 p-3 rounded bg-gray-50">
              {Number(printTarget.discount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-mono">- {formatINR(printTarget.discount)}</span>
                </div>
              )}
              {Number(printTarget.tax) > 0 && (
                <div className="flex justify-between">
                  <span>Tax / GST:</span>
                  <span className="font-mono">+ {formatINR(printTarget.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-2 text-black">
                <span>Grand Total:</span>
                <span className="font-mono">{formatINR(printTarget.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="flex justify-between items-end pt-12 border-t border-gray-300 text-xs">
            <div>
              <p className="font-bold">Thank you for choosing VitalSync Healthcare.</p>
              <p className="text-gray-500">For billing queries: billing@vitalsync.com</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-gray-500 mb-1" />
              <p className="font-bold">Authorized Signatory</p>
              <p className="text-gray-500">Accounts & Billing Dept</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
