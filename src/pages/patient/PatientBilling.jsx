import React, { useState, useEffect } from 'react';
import { patientPortalApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const PatientBilling = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await patientPortalApi.getBills();
        setBills(res.data || []);
      } catch (err) {
        console.error('Error fetching bills:', err);
        toast.error('Failed to load billing history.');
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const totalDue = bills
    .filter((b) => (b.paymentStatus || '').toLowerCase() === 'pending')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">My Invoices & Billing Statements</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Review itemized consultation fees, medication charges, and payment status.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-amber-600">account_balance_wallet</span>
          <div>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Outstanding Balance</p>
            <p className="text-lg font-extrabold text-on-surface">₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading invoices..." />
      ) : bills.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title="No Invoices Found"
          description="You do not have any active or past medical bills on record."
        />
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-variant pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-primary">{bill.billCode}</span>
                    <StatusBadge status={bill.paymentStatus} size="xs" />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Date: <strong>{bill.billDate}</strong> • Doctor: <strong>{bill.doctorName || 'Attending Physician'}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">Total Amount</span>
                  <span className="text-xl font-black text-on-surface">
                    ₹{Number(bill.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Itemized Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-surface p-4 rounded-xl border border-outline-variant/40">
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Consultation Fee</span>
                  <span className="font-bold text-on-surface">₹{Number(bill.consultationFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Medications</span>
                  <span className="font-bold text-on-surface">₹{Number(bill.medicineCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Other Diagnostics</span>
                  <span className="font-bold text-on-surface">₹{Number(bill.otherCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Discount / Insurance</span>
                  <span className="font-bold text-emerald-600">-₹{Number(bill.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Payment Method</span>
                  <span className="font-bold text-primary">{bill.paymentMethod || 'Cash / Card'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientBilling;
