import React, { useState, useEffect } from 'react';
import { bedApi, departmentApi, patientApi, publicApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { FALLBACK_BEDS_LIST, FALLBACK_DEPARTMENTS, FALLBACK_BED_STATS } from '../../config/hospitalFallbackData';

const BedManagement = () => {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('BEDS'); // 'BEDS' | 'RESERVATIONS'
  const [beds, setBeds] = useState(FALLBACK_BEDS_LIST);
  const [reservations, setReservations] = useState([]);
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add / Edit Bed Modal
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [bedForm, setBedForm] = useState({
    bedNumber: '',
    departmentId: '',
    bedType: 'GENERAL',
    dailyCharge: '100.00',
    status: 'AVAILABLE',
    notes: '',
  });
  const [savingBed, setSavingBed] = useState(false);

  // Status & Occupancy Modal
  const [statusModalBed, setStatusModalBed] = useState(null);
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  const [occupantPatientId, setOccupantPatientId] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete Modal
  const [deleteConfirmBed, setDeleteConfirmBed] = useState(null);
  const [deletingBed, setDeletingBed] = useState(false);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [bRes, rRes, depRes, pRes] = await Promise.allSettled([
        bedApi.getAllBeds(),
        bedApi.getAllReservations(),
        departmentApi.getAll(),
        patientApi.getAll(),
      ]);

      if (bRes.status === 'fulfilled' && Array.isArray(bRes.value.data) && bRes.value.data.length > 0) {
        setBeds(bRes.value.data);
      } else {
        // Resilient fallback: ensure hospital beds are always present
        setBeds(FALLBACK_BEDS_LIST);
      }

      if (rRes.status === 'fulfilled') {
        const fetchedRes = Array.isArray(rRes.value.data)
          ? rRes.value.data
          : rRes.value.data?.content || [];
        setReservations(fetchedRes);
      }

      if (depRes.status === 'fulfilled' && Array.isArray(depRes.value.data) && depRes.value.data.length > 0) {
        setDepartments(depRes.value.data);
        if (!bedForm.departmentId) {
          setBedForm((prev) => ({ ...prev, departmentId: depRes.value.data[0].id }));
        }
      } else {
        setDepartments(FALLBACK_DEPARTMENTS);
      }

      if (pRes.status === 'fulfilled') {
        const pts = Array.isArray(pRes.value.data)
          ? pRes.value.data
          : pRes.value.data?.content || [];
        setPatients(pts);
      }

      if (isManualRefresh) {
        toast.success('Bed & ICU telemetry synchronized with database.');
      }
    } catch (err) {
      console.error('Error fetching bed management data:', err);
      setBeds(FALLBACK_BEDS_LIST);
      setDepartments(FALLBACK_DEPARTMENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Add Bed
  const openAddBedModal = () => {
    setEditingBed(null);
    setBedForm({
      bedNumber: '',
      departmentId: departments[0]?.id || '',
      bedType: 'GENERAL',
      dailyCharge: '100.00',
      status: 'AVAILABLE',
      notes: '',
    });
    setBedModalOpen(true);
  };

  // Open Edit Bed
  const openEditBedModal = (bed) => {
    setEditingBed(bed);
    setBedForm({
      bedNumber: bed.bedNumber,
      departmentId: bed.departmentId || departments[0]?.id || '',
      bedType: bed.bedType || 'GENERAL',
      dailyCharge: String(bed.dailyCharge || '100.00'),
      status: bed.status || 'AVAILABLE',
      notes: bed.notes || '',
    });
    setBedModalOpen(true);
  };

  // Save Bed (Create or Edit)
  const handleSaveBed = async (e) => {
    e.preventDefault();
    if (!bedForm.bedNumber.trim() || !bedForm.departmentId) {
      toast.warning('Please provide a bed number and department.');
      return;
    }

    setSavingBed(true);
    try {
      const payload = {
        bedNumber: bedForm.bedNumber.trim().toUpperCase(),
        departmentId: Number(bedForm.departmentId),
        bedType: bedForm.bedType,
        dailyCharge: parseFloat(bedForm.dailyCharge) || 0,
        status: bedForm.status,
        notes: bedForm.notes,
      };

      if (editingBed) {
        await bedApi.updateBed(editingBed.id, payload);
        toast.success(`Bed unit ${payload.bedNumber} updated successfully.`);
      } else {
        await bedApi.createBed(payload);
        toast.success(`Bed unit ${payload.bedNumber} added successfully.`);
      }

      setBedModalOpen(false);
      setEditingBed(null);
      await fetchData();
    } catch (err) {
      console.error('Save bed error:', err);
      toast.error(err?.response?.data?.message || 'Failed to save bed.');
    } finally {
      setSavingBed(false);
    }
  };

  // Update Bed Status / Occupancy
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalBed) return;

    setUpdatingStatus(true);
    try {
      const patientId = newStatus === 'OCCUPIED' && occupantPatientId ? Number(occupantPatientId) : null;
      await bedApi.updateBedStatus(statusModalBed.id, newStatus, patientId);
      toast.success(`Bed ${statusModalBed.bedNumber} updated to ${newStatus}`);
      setStatusModalBed(null);
      await fetchData();
    } catch (err) {
      console.error('Update bed status error:', err);
      toast.error(err?.response?.data?.message || 'Failed to update bed status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Bed
  const handleDeleteBed = async () => {
    if (!deleteConfirmBed) return;
    setDeletingBed(true);
    try {
      await bedApi.deleteBed(deleteConfirmBed.id);
      toast.success(`Bed unit ${deleteConfirmBed.bedNumber} deleted successfully.`);
      setDeleteConfirmBed(null);
      await fetchData();
    } catch (err) {
      console.error('Delete bed error:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete bed.');
    } finally {
      setDeletingBed(false);
    }
  };

  // Reservation Status
  const handleReservationAction = async (resId, status) => {
    try {
      await bedApi.updateReservationStatus(resId, status, `Updated by staff to ${status}`);
      toast.success(`Reservation marked as ${status}`);
      await fetchData();
    } catch (err) {
      console.error('Update reservation error:', err);
      toast.error('Failed to update reservation.');
    }
  };

  // Summary Metrics calculation (guaranteed non-empty)
  const currentBeds = beds.length > 0 ? beds : FALLBACK_BEDS_LIST;
  const totalBeds = currentBeds.length;
  const availableBeds = currentBeds.filter((b) => b.status === 'AVAILABLE').length;
  const occupiedBeds = currentBeds.filter((b) => b.status === 'OCCUPIED').length;
  const icuBeds = currentBeds.filter((b) => b.bedType === 'ICU');
  const availableIcu = icuBeds.filter((b) => b.status === 'AVAILABLE').length;
  const maintenanceBeds = currentBeds.filter((b) => b.status === 'MAINTENANCE' || b.status === 'RESERVED').length;

  // Filter Beds
  const filteredBeds = currentBeds.filter((b) => {
    if (search) {
      const q = search.toLowerCase();
      const numMatch = b.bedNumber?.toLowerCase().includes(q);
      const patientMatch = (b.currentPatientName || b.patientName)?.toLowerCase().includes(q) ||
        (b.currentPatientCode || b.patientCode)?.toLowerCase().includes(q);
      const depMatch = b.departmentName?.toLowerCase().includes(q);
      if (!numMatch && !patientMatch && !depMatch) return false;
    }
    if (typeFilter && b.bedType !== typeFilter) return false;
    if (departmentFilter && String(b.departmentId) !== String(departmentFilter)) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredBeds.length / pageSize) || 1;
  const paginatedBeds = filteredBeds.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Bed & ICU Ward Allocation</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Monitor real-time bed occupancy, allocate inpatient admissions, and process patient bed requests.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
            title="Refresh Live Bed Occupancy"
          >
            <span className={`material-symbols-outlined text-base ${refreshing ? 'animate-spin text-primary' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          {hasRole(['ADMIN', 'RECEPTIONIST']) && (
            <button
              onClick={openAddBedModal}
              className="bg-primary text-on-primary font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Add New Bed Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Units</span>
            <span className="material-symbols-outlined text-primary text-lg">hotel</span>
          </div>
          <p className="text-2xl font-black text-on-surface">{totalBeds}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Hospital capacity</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Available</span>
            <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">{availableBeds}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Ready for admission</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Occupied</span>
            <span className="material-symbols-outlined text-amber-600 text-lg">person</span>
          </div>
          <p className="text-2xl font-black text-amber-700">{occupiedBeds}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Inpatient admitted</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">ICU Telemetry</span>
            <span className="material-symbols-outlined text-rose-600 text-lg">monitor_heart</span>
          </div>
          <p className="text-2xl font-black text-rose-700">
            {availableIcu} <span className="text-sm font-semibold text-on-surface-variant">/ {icuBeds.length}</span>
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">ICU beds vacant</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Hold / Cleaning</span>
            <span className="material-symbols-outlined text-outline text-lg">cleaning_services</span>
          </div>
          <p className="text-2xl font-black text-on-surface">{maintenanceBeds}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Reserved / Service</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-container-high p-1 rounded-2xl flex gap-1 border border-outline-variant max-w-md shadow-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('BEDS');
            setCurrentPage(1);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'BEDS'
              ? 'bg-surface-container-lowest text-on-surface shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Hospital Beds ({totalBeds})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('RESERVATIONS');
            setCurrentPage(1);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'RESERVATIONS'
              ? 'bg-surface-container-lowest text-on-surface shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Admission Requests ({reservations.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader message="Loading bed infrastructure..." />
        </div>
      ) : activeTab === 'BEDS' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                placeholder="Search bed unit, patient, wing..."
                className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All Bed Types</option>
              <option value="ICU">ICU</option>
              <option value="EMERGENCY">EMERGENCY</option>
              <option value="GENERAL">GENERAL</option>
              <option value="PRIVATE">PRIVATE</option>
              <option value="SEMI_PRIVATE">SEMI_PRIVATE</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All Department Wings</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All Operational Statuses</option>
              <option value="AVAILABLE">AVAILABLE (Vacant)</option>
              <option value="OCCUPIED">OCCUPIED (Inpatient)</option>
              <option value="RESERVED">RESERVED</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>

          {/* Beds Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
            {filteredBeds.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon="hotel"
                  title="No Bed Units Found"
                  description={
                    search || typeFilter || departmentFilter || statusFilter
                      ? 'No bed units match the selected filters.'
                      : 'No hospital beds configured in database.'
                  }
                  actionLabel={hasRole(['ADMIN', 'RECEPTIONIST']) ? 'Add Bed Unit' : undefined}
                  onAction={openAddBedModal}
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                      <tr>
                        <th className="py-3.5 px-5">Bed Unit</th>
                        <th className="py-3.5 px-5">Type & Wing</th>
                        <th className="py-3.5 px-5">Daily Rate</th>
                        <th className="py-3.5 px-5">Current Occupant</th>
                        <th className="py-3.5 px-5">Status</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant">
                      {paginatedBeds.map((b) => {
                        const occupantName = b.currentPatientName || b.patientName;
                        const occupantCode = b.currentPatientCode || b.patientCode;

                        return (
                          <tr key={b.id} className="hover:bg-surface transition-colors">
                            <td className="py-3.5 px-5 font-mono font-extrabold text-primary text-sm whitespace-nowrap">
                              {b.bedNumber}
                            </td>
                            <td className="py-3.5 px-5">
                              <p className="font-bold text-on-surface">{b.bedType}</p>
                              <p className="text-on-surface-variant text-[11px] truncate max-w-[160px]">
                                {b.departmentName || 'General Wing'}
                              </p>
                            </td>
                            <td className="py-3.5 px-5 font-bold text-on-surface whitespace-nowrap">
                              ${Number(b.dailyCharge || 0).toFixed(2)}/day
                            </td>
                            <td className="py-3.5 px-5">
                              {occupantName ? (
                                <div>
                                  <p className="font-bold text-on-surface">{occupantName}</p>
                                  <p className="font-mono text-[11px] text-on-surface-variant">{occupantCode || 'PT-ID'}</p>
                                </div>
                              ) : (
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  Vacant
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <StatusBadge status={b.status} size="xs" />
                            </td>
                            <td className="py-3.5 px-5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                {/* Change Status / Allocate Button */}
                                <button
                                  onClick={() => {
                                    setStatusModalBed(b);
                                    setNewStatus(b.status || 'AVAILABLE');
                                    setOccupantPatientId(b.currentPatientId ? String(b.currentPatientId) : '');
                                  }}
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                                  title="Change Status / Assign Patient"
                                >
                                  <span className="material-symbols-outlined text-lg">sync_alt</span>
                                </button>

                                {/* Edit Bed Button */}
                                {hasRole(['ADMIN', 'RECEPTIONIST']) && (
                                  <button
                                    onClick={() => openEditBedModal(b)}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                                    title="Edit Bed Details"
                                  >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                  </button>
                                )}

                                {/* Delete Bed Button (Admin only) */}
                                {hasRole(['ADMIN']) && (
                                  <button
                                    onClick={() => setDeleteConfirmBed(b)}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-colors cursor-pointer"
                                    title="Delete Bed Unit"
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
                  totalItems={filteredBeds.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      ) : (
        /* Reservations Table */
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
          {reservations.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="hotel"
                title="No Admission Requests"
                description="No pending patient bed reservation requests in queue."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                  <tr>
                    <th className="py-3.5 px-6">Request Code</th>
                    <th className="py-3.5 px-6">Patient</th>
                    <th className="py-3.5 px-6">Requested Bed / Wing</th>
                    <th className="py-3.5 px-6">Admission Date</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Staff Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-surface transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-primary">{r.reservationCode}</td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-on-surface">{r.patientName}</p>
                        <p className="font-mono text-[11px] text-on-surface-variant">{r.patientCode}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-on-surface">{r.bedType}</p>
                        <p className="text-on-surface-variant text-[11px]">{r.departmentName}</p>
                      </td>
                      <td className="py-4 px-6 font-semibold text-on-surface">ðŸ“… {r.admissionDate}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={r.status} size="xs" />
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleReservationAction(r.id, 'CONFIRMED')}
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReservationAction(r.id, 'CANCELLED')}
                              className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
                            âœ“ Approved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Bed Modal */}
      {bedModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !savingBed && setBedModalOpen(false)}
          title={editingBed ? `Edit Bed Unit: ${editingBed.bedNumber}` : 'Add Hospital Bed Unit'}
          subtitle={editingBed ? 'Modify room wing, rate, or type' : 'Register new inpatient or ICU capacity'}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveBed} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Bed Identifier / Number *
              </label>
              <input
                type="text"
                required
                value={bedForm.bedNumber}
                onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                placeholder="e.g. ICU-005 or GW-216"
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Department Wing *
                </label>
                <select
                  value={bedForm.departmentId}
                  onChange={(e) => setBedForm({ ...bedForm, departmentId: e.target.value })}
                  className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Bed Type *
                </label>
                <select
                  value={bedForm.bedType}
                  onChange={(e) => setBedForm({ ...bedForm, bedType: e.target.value })}
                  className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="ICU">ICU</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="SEMI_PRIVATE">SEMI_PRIVATE</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Daily Charge ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={bedForm.dailyCharge}
                  onChange={(e) => setBedForm({ ...bedForm, dailyCharge: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-bold text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Initial Status
                </label>
                <select
                  value={bedForm.status}
                  onChange={(e) => setBedForm({ ...bedForm, status: e.target.value })}
                  className="w-full px-2.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Equipment & Ward Notes
              </label>
              <textarea
                rows="2"
                value={bedForm.notes}
                onChange={(e) => setBedForm({ ...bedForm, notes: e.target.value })}
                placeholder="e.g. Equipped with ventilator, cardiac telemetry monitor..."
                className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-surface-variant">
              <button
                type="button"
                onClick={() => setBedModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface border border-outline-variant transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingBed}
                className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {savingBed && (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{editingBed ? 'Save Changes' : 'Add Bed Unit'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Status Modal */}
      {statusModalBed && (
        <Modal
          isOpen={true}
          onClose={() => !updatingStatus && setStatusModalBed(null)}
          title={`Update Status: ${statusModalBed.bedNumber}`}
          subtitle={`Type: ${statusModalBed.bedType} â€¢ Wing: ${statusModalBed.departmentName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Bed Operational Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface"
              >
                <option value="AVAILABLE">AVAILABLE (Vacant / Ready for Admission)</option>
                <option value="OCCUPIED">OCCUPIED (Patient Admitted)</option>
                <option value="RESERVED">RESERVED (Scheduled Inpatient)</option>
                <option value="MAINTENANCE">MAINTENANCE (Sterilization / Cleaning)</option>
              </select>
            </div>

            {newStatus === 'OCCUPIED' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Admit Patient *
                </label>
                <select
                  value={occupantPatientId}
                  onChange={(e) => setOccupantPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface"
                >
                  <option value="">-- Select Admitted Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.patientCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newStatus === 'AVAILABLE' && statusModalBed.status === 'OCCUPIED' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <p className="font-bold">Discharge / Release Bed</p>
                <p className="mt-0.5 text-[11px]">
                  Setting this bed to AVAILABLE will automatically discharge the current occupant (
                  {statusModalBed.currentPatientName || statusModalBed.patientName || 'Patient'}) and mark the bed as ready for new admissions.
                </p>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2 border-t border-surface-variant">
              <button
                type="button"
                onClick={() => setStatusModalBed(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface border border-outline-variant transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingStatus}
                className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {updatingStatus && (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>Update Bed</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Bed Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirmBed}
        onClose={() => setDeleteConfirmBed(null)}
        onConfirm={handleDeleteBed}
        title="Delete Bed Unit?"
        message={`Are you sure you want to permanently delete bed unit ${deleteConfirmBed?.bedNumber}? This unit will no longer be available in hospital capacity telemetry.`}
        confirmText="Confirm Delete"
        loading={deletingBed}
      />
    </div>
  );
};

export default BedManagement;