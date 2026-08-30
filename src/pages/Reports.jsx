import React, { useState, useEffect } from 'react';
import { reportApi, appointmentApi, patientApi, doctorApi, billApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ErrorState from '../components/common/ErrorState';
import { Loader } from '../components/common/Loader';
import VitalSyncLogo from '../components/common/VitalSyncLogo';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

const Reports = () => {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month'); // 'today', 'week', 'month', 'all'

  const [reportData, setReportData] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalBills: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    appointmentsByStatus: {},
    billsByStatus: {},
    doctorWorkloads: [],
    recentRegistrations: [],
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try backend report API or aggregate live from endpoints
      const [statsRes, aptRes, patRes, docRes, billRes] = await Promise.all([
        reportApi.getSummary({ range: dateRange }).catch(() => null),
        appointmentApi.getAll(),
        patientApi.getAll(),
        doctorApi.getAll(),
        billApi.getAll(),
      ]);

      const aptList = Array.isArray(aptRes.data) ? aptRes.data : aptRes.data?.content || [];
      const patList = Array.isArray(patRes.data) ? patRes.data : patRes.data?.content || [];
      const docList = Array.isArray(docRes.data) ? docRes.data : docRes.data?.content || [];
      const billList = Array.isArray(billRes.data) ? billRes.data : billRes.data?.content || [];

      // Calculate status breakdowns
      const aptStatusMap = aptList.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});

      const billStatusMap = billList.reduce((acc, b) => {
        acc[b.paymentStatus] = (acc[b.paymentStatus] || 0) + 1;
        return acc;
      }, {});

      // Calculate financials
      const collected = billList
        .filter((b) => b.paymentStatus === 'Paid')
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

      const pending = billList
        .filter((b) => b.paymentStatus === 'Pending')
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

      // Doctor workloads
      const workloads = docList.map((doc) => {
        const docApts = aptList.filter((a) => String(a.doctor?.id || a.doctorId) === String(doc.id));
        return {
          id: doc.id,
          name: doc.fullName,
          specialization: doc.specialization,
          totalAppointments: docApts.length,
          completedAppointments: docApts.filter((a) => a.status === 'Completed').length,
          status: doc.status,
        };
      });

      if (statsRes?.data) {
        setReportData({
          ...statsRes.data,
          doctorWorkloads: workloads,
        });
      } else {
        setReportData({
          totalPatients: patList.length,
          totalDoctors: docList.length,
          totalAppointments: aptList.length,
          totalBills: billList.length,
          totalRevenue: collected,
          pendingRevenue: pending,
          appointmentsByStatus: aptStatusMap,
          billsByStatus: billStatusMap,
          doctorWorkloads: workloads,
          recentRegistrations: patList.slice(0, 5),
        });
      }
    } catch (err) {
      console.error('Failed to load reports analytics:', err);
      setError('Unable to load analytics and reporting metrics.');
      toast.error('Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const rows = [
        ['Metric Category', 'Metric Name', 'Value'],
        ['Hospital Overview', 'Total Patients Registered', reportData.totalPatients],
        ['Hospital Overview', 'Active Medical Doctors', reportData.totalDoctors],
        ['Hospital Overview', 'Total Consultations Scheduled', reportData.totalAppointments],
        ['Financials', 'Collected Revenue (INR)', reportData.totalRevenue],
        ['Financials', 'Pending Receivables (INR)', reportData.pendingRevenue],
        ['Financials', 'Total Invoices Generated', reportData.totalBills],
        [],
        ['Doctor Name', 'Specialization', 'Appointments Handled', 'Completed Consultations'],
        ...reportData.doctorWorkloads.map((d) => [
          d.name,
          d.specialization,
          d.totalAppointments,
          d.completedAppointments,
        ]),
      ];

      const csvContent =
        'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `VitalSync_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Analytics report downloaded as CSV.');
    } catch (err) {
      toast.error('Failed to export CSV report.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loader message="Generating clinical analytics..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadReportData} />;
  }

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Analytics & Reports</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Hospital performance, clinical consultation volumes, and financial indicators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-sm text-on-surface font-semibold focus:outline-none focus:border-primary shadow-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time History</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-4 py-2 rounded-xl hover:bg-primary-container transition-colors text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Collected Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <p className="font-stats-lg text-stats-lg text-emerald-700">{formatINR(reportData.totalRevenue)}</p>
          <p className="text-xs text-on-surface-variant mt-1">Paid Patient Invoices</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Patients</span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
          </div>
          <p className="font-stats-lg text-stats-lg text-on-surface">{reportData.totalPatients}</p>
          <p className="text-xs text-on-surface-variant mt-1">Active Patient Registrations</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Consultations</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">event_available</span>
            </div>
          </div>
          <p className="font-stats-lg text-stats-lg text-purple-700">{reportData.totalAppointments}</p>
          <p className="text-xs text-on-surface-variant mt-1">Scheduled / Completed</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Pending Receivables</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">hourglass_empty</span>
            </div>
          </div>
          <p className="font-stats-lg text-stats-lg text-amber-700">{formatINR(reportData.pendingRevenue)}</p>
          <p className="text-xs text-on-surface-variant mt-1">Pending Invoice Balances</p>
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status Breakdown */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-surface-variant pb-3">
            <h3 className="font-headline-md text-headline-md text-on-surface">Appointment Distribution</h3>
            <span className="text-xs text-on-surface-variant font-semibold">Total: {reportData.totalAppointments}</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Confirmed', color: 'bg-emerald-500', count: reportData.appointmentsByStatus['Confirmed'] || 0 },
              { label: 'In Progress', color: 'bg-sky-500', count: reportData.appointmentsByStatus['In Progress'] || 0 },
              { label: 'Scheduled', color: 'bg-amber-500', count: reportData.appointmentsByStatus['Scheduled'] || 0 },
              { label: 'Urgent', color: 'bg-rose-500', count: reportData.appointmentsByStatus['Urgent'] || 0 },
              { label: 'Completed', color: 'bg-slate-500', count: reportData.appointmentsByStatus['Completed'] || 0 },
              { label: 'Cancelled', color: 'bg-red-300', count: reportData.appointmentsByStatus['Cancelled'] || 0 },
            ].map((st) => {
              const pct = reportData.totalAppointments > 0 ? ((st.count / reportData.totalAppointments) * 100).toFixed(0) : 0;
              return (
                <div key={st.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-on-surface">
                    <span>{st.label}</span>
                    <span>{st.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`h-full ${st.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Payment Breakdown */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-surface-variant pb-3">
            <h3 className="font-headline-md text-headline-md text-on-surface">Financial Summary</h3>
            <span className="text-xs text-on-surface-variant font-semibold">Total Invoices: {reportData.totalBills}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Collected</p>
              <p className="font-stats-lg text-stats-lg text-emerald-700 mt-1">{formatINR(reportData.totalRevenue)}</p>
              <p className="text-xs text-emerald-600 mt-1">{reportData.billsByStatus['Paid'] || 0} Invoices Settled</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Outstanding Receivables</p>
              <p className="font-stats-lg text-stats-lg text-amber-700 mt-1">{formatINR(reportData.pendingRevenue)}</p>
              <p className="text-xs text-amber-600 mt-1">{reportData.billsByStatus['Pending'] || 0} Invoices Pending</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-outline-variant text-xs space-y-2">
            <p className="font-bold text-on-surface uppercase tracking-wider">Clinical Efficiency Score</p>
            <p className="text-on-surface-variant">
              Hospital is maintaining continuous operational flow with {reportData.totalDoctors} attending physicians across cardiology, neurology, pediatrics, and general practice.
            </p>
          </div>
        </div>
      </div>

      {/* Doctor Workload & Consultations Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-surface-variant flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-on-surface">Physician Workload Summary</h3>
          <span className="text-xs text-on-surface-variant font-semibold">Staff Duty Distribution</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-high border-b border-surface-variant">
              <tr>
                <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Doctor</th>
                <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Specialization</th>
                <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Total Appointments</th>
                <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Completed</th>
                <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Duty Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {reportData.doctorWorkloads.map((doc) => (
                <tr key={doc.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 font-semibold text-on-surface">{doc.name}</td>
                  <td className="px-4 py-3 text-xs text-primary font-medium">{doc.specialization}</td>
                  <td className="px-4 py-3 text-xs font-bold text-on-surface">{doc.totalAppointments}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-emerald-700">{doc.completedAppointments}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Report View (Visible only during print) */}
      <div className="hidden print:block printable-area p-8 max-w-4xl mx-auto bg-white text-black font-sans">
        <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-6">
          <VitalSyncLogo className="w-12 h-12" showText={true} />
          <div className="text-right text-xs">
            <h2 className="text-base font-bold text-primary">ADMINISTRATIVE ANALYTICS REPORT</h2>
            <p>Generated on: {new Date().toLocaleString()}</p>
            <p>Period: {dateRange.toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 border border-gray-300 p-4 rounded text-xs">
          <div>
            <p className="text-gray-500 font-bold uppercase">Total Revenue Collected</p>
            <p className="text-base font-bold mt-0.5">{formatINR(reportData.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold uppercase">Total Patient Registrations</p>
            <p className="text-base font-bold mt-0.5">{reportData.totalPatients}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold uppercase">Total Consultations</p>
            <p className="text-base font-bold mt-0.5">{reportData.totalAppointments}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-gray-300 text-xs mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left">Doctor Name</th>
              <th className="border border-gray-300 p-2 text-left">Specialization</th>
              <th className="border border-gray-300 p-2 text-center">Consultations</th>
              <th className="border border-gray-300 p-2 text-center">Completed</th>
            </tr>
          </thead>
          <tbody>
            {reportData.doctorWorkloads.map((d) => (
              <tr key={d.id} className="border border-gray-300">
                <td className="border border-gray-300 p-2 font-semibold">{d.name}</td>
                <td className="border border-gray-300 p-2">{d.specialization}</td>
                <td className="border border-gray-300 p-2 text-center font-bold">{d.totalAppointments}</td>
                <td className="border border-gray-300 p-2 text-center">{d.completedAppointments}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-end pt-12 border-t border-gray-300 text-xs">
          <p className="text-gray-500">Confidential Hospital Internal Management Document</p>
          <div className="text-center">
            <div className="w-44 border-b border-gray-400 mb-1" />
            <p className="font-bold">Medical Director Approval</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
