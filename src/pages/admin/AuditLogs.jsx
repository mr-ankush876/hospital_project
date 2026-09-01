import React, { useState, useEffect } from 'react';
import { userManagementApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const toast = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await userManagementApi.getAuditLogs({
        search,
        role: roleFilter,
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      toast.error('Failed to load system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Security & System Audit Logs</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Immutable tracking record of user authentications, account creations, medical changes, and security events.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Audit Trail Active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by action, username, or details..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="DOCTOR">DOCTOR</option>
          <option value="RECEPTIONIST">RECEPTIONIST</option>
          <option value="PATIENT">PATIENT</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader message="Querying security audit ledger..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="history"
              title="No Audit Logs"
              description="No audit events matched your search filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-variant">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">User / Actor</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Action / Event</th>
                  <th className="py-3.5 px-6">Entity Target</th>
                  <th className="py-3.5 px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface transition-colors">
                    <td className="py-4 px-6 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-bold text-on-surface">
                      @{log.username}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={log.role} size="xs" />
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-primary">
                      {log.action}
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant font-mono text-[11px]">
                      {log.entityName} {log.entityId ? `#${log.entityId}` : ''}
                    </td>
                    <td className="py-4 px-6 text-on-surface max-w-sm">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
