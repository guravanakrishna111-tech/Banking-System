import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Layers, ShieldCheck, RefreshCw, Clock } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/admin/audit-logs/');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">Immutable record of administrative operations, logins, and status adjustments</p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl shadow-xs transition flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            Loading security audit logs...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B192C] text-slate-300 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Admin Operator</th>
                  <th className="py-3.5 px-4">Target Type</th>
                  <th className="py-3.5 px-4">Target ID</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {log.admin_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {log.target_type}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {log.target_id || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-sm truncate">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            No audit records found.
          </div>
        )}
      </div>
    </div>
  );
}
