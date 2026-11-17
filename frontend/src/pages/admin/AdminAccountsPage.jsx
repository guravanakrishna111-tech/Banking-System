import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock, 
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.account_type = typeFilter;
      if (statusFilter !== '') params.is_active = statusFilter;

      const res = await api.get('/accounts/admin/accounts/', { params });
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to fetch admin accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [typeFilter, statusFilter]);

  const handleToggleStatus = async (acc) => {
    const action = acc.is_active ? 'freeze/deactivate' : 'unfreeze/activate';
    if (!window.confirm(`Are you sure you want to ${action} account #${acc.account_number}?`)) return;

    setTogglingId(acc.id);
    try {
      const res = await api.post(`/accounts/admin/accounts/${acc.id}/toggle-status/`);
      setAccounts((prev) =>
        prev.map((a) => (a.id === acc.id ? { ...a, is_active: res.data.is_active } : a))
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Bank Accounts Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitor all bank accounts across the bank and manage liquidity restrictions</p>
        </div>
        <button
          onClick={fetchAccounts}
          className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl shadow-xs transition flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAccounts()}
            placeholder="Search account number or holder..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Account Types</option>
            <option value="SAVINGS">Savings Account</option>
            <option value="CURRENT">Current Account</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Account Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Frozen / Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            Loading bank accounts...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B192C] text-slate-300 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Account Number</th>
                  <th className="py-3.5 px-4">Account Holder</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">IFSC Code</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Freeze Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {acc.account_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold text-slate-900">{acc.user_name}</div>
                      <div className="text-[11px] text-slate-400">{acc.user_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {acc.account_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {acc.ifsc_code}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {acc.is_active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{acc.is_active ? 'ACTIVE' : 'FROZEN'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(acc)}
                        disabled={togglingId === acc.id}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 mx-auto ${
                          acc.is_active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {acc.is_active ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Freeze</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unfreeze</span>
                          </>
                        )}
                      </button>
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
}
