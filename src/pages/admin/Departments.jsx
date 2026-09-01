import React, { useState, useEffect } from 'react';
import { departmentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deleteModalId, setDeleteModalId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    headDoctorName: '',
    totalBeds: 10,
    status: 'Active',
  });
  const [saving, setSaving] = useState(false);

  const toast = useToast();

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentApi.getAll();
      setDepartments(res.data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      toast.error('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setForm({
      name: '',
      description: '',
      headDoctorName: '',
      totalBeds: 10,
      status: 'Active',
    });
    setModalOpen(true);
  };

  const openEditModal = (d) => {
    setEditingDept(d);
    setForm({
      name: d.name,
      description: d.description || '',
      headDoctorName: d.headDoctorName || '',
      totalBeds: d.totalBeds ?? 10,
      status: d.status || 'Active',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDept) {
        await departmentApi.update(editingDept.id, form);
        toast.success('Department updated successfully.');
      } else {
        await departmentApi.create(form);
        toast.success('Department created successfully.');
      }
      setModalOpen(false);
      fetchDepartments();
    } catch (err) {
      console.error('Save department error:', err);
      toast.error(err?.response?.data?.message || 'Failed to save department.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    try {
      await departmentApi.delete(deleteModalId);
      toast.success('Department deleted successfully.');
      setDeleteModalId(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete department.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Hospital Department Administration</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Configure clinical wings, department heads, total ward bed capacities, and active operational status.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Add Department</span>
        </button>
      </div>

      {/* Departments Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader message="Loading hospital departments..." />
          </div>
        ) : departments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="domain"
              title="No Departments Found"
              description="No clinical departments have been created yet."
              actionLabel="Create Department"
              onAction={openCreateModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                <tr>
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-6">Department Name</th>
                  <th className="py-3.5 px-6">Department Head</th>
                  <th className="py-3.5 px-6">Total Beds</th>
                  <th className="py-3.5 px-6">Available</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-primary">{d.departmentCode}</td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-on-surface">{d.name}</p>
                      <p className="text-on-surface-variant text-[11px] truncate max-w-xs">{d.description}</p>
                    </td>
                    <td className="py-4 px-6 font-semibold text-on-surface">{d.headDoctorName || 'Not Assigned'}</td>
                    <td className="py-4 px-6 font-bold text-on-surface">{d.totalBeds ?? 0}</td>
                    <td className="py-4 px-6 text-emerald-700 font-extrabold">{d.availableBeds ?? 0}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={d.status} size="xs" />
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(d)}
                        className="bg-surface border border-outline-variant hover:border-primary/40 text-on-surface text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteModalId(d.id)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                {editingDept ? 'Edit Department' : 'Create Department'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Cardiology"
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Department Head Doctor
                </label>
                <input
                  type="text"
                  value={form.headDoctorName}
                  onChange={(e) => setForm({ ...form, headDoctorName: e.target.value })}
                  placeholder="e.g. Dr. Robert Chen"
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Total Bed Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.totalBeds}
                    onChange={(e) => setForm({ ...form, totalBeds: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Scope of clinical practice..."
                  className="w-full px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-surface-variant flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-xl hover:bg-primary-container disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteModalId}
        onClose={() => setDeleteModalId(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message="Are you sure you want to remove this department record?"
        confirmText="Yes, Delete Department"
        danger={true}
      />
    </div>
  );
};

export default Departments;
