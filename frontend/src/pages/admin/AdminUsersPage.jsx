import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Lock, 
  Unlock, 
  X, 
  CreditCard,
  RefreshCw
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/admin/users/', {
        params: { search: search.trim() }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${user.username}"?`)) return;

    setTogglingId(user.id);
    try {
      const res = await api.post(`/accounts/admin/users/${user.id}/toggle-status/`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: res.data.is_active } : u))
      );
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser((prev) => ({ ...prev, is_active: res.data.is_active }));
      }
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">View registered profiles, monitor linked accounts, and manage activation status</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl shadow-xs transition flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by customer name, username, email, or phone..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
        >
          Search
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            Loading registered users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B192C] text-slate-300 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Accounts</th>
                  <th className="py-3.5 px-4 text-right">Total Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">@{u.username}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phone_number || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {u.accounts_count} accounts
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${parseFloat(u.total_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {u.is_active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{u.is_active ? 'ACTIVE' : 'DEACTIVATED'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={togglingId === u.id}
                            className={`p-1.5 rounded-lg transition ${
                              u.is_active
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">{selectedUser.name} ({selectedUser.username})</h3>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400">Email Address:</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedUser.email}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400">Phone Number:</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedUser.phone_number || 'N/A'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400">Account Role:</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedUser.role}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400">Status:</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedUser.is_active ? 'Active' : 'Deactivated'}</div>
                </div>
              </div>

              {/* Linked Accounts */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Linked Bank Accounts ({selectedUser.accounts?.length || 0})</span>
                </h4>
                <div className="space-y-2">
                  {selectedUser.accounts?.map((acc) => (
                    <div key={acc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-bold text-slate-900">{acc.account_number}</div>
                        <div className="text-[11px] text-slate-500">{acc.account_type_display} • IFSC: {acc.ifsc_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-600">${parseFloat(acc.balance).toFixed(2)}</div>
                        <span className={`text-[10px] font-bold ${acc.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {acc.is_active ? 'ACTIVE' : 'FROZEN'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
