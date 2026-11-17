import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { 
  History, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  SendHorizontal, 
  CheckCircle2, 
  Calendar,
  RefreshCw
} from 'lucide-react';
import { downloadReceiptPDF } from '../../utils/pdfReceipt';

export default function TransactionsPage() {
  const { accounts } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type = typeFilter;
      if (selectedAccount) params.account_id = selectedAccount;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await api.get('/transactions/history/', { params });
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, selectedAccount, dateFrom, dateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setSelectedAccount('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Transaction History</h1>
          <p className="text-xs text-slate-500 mt-0.5">Search, filter, and download certified electronic receipts</p>
        </div>
        <button
          onClick={fetchTransactions}
          className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl shadow-xs transition flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search by TXN ID or note */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search TXN ID or remarks..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Transaction Types</option>
              <option value="TRANSFER">Account Transfers</option>
              <option value="DEPOSIT">Cash Deposits</option>
              <option value="WITHDRAWAL">Cash Withdrawals</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All My Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_type} • #{acc.account_number.slice(-4)}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="relative">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="From Date"
            />
          </div>

          {/* Date To / Actions */}
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="To Date"
            />
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
              title="Reset Filters"
            >
              Reset
            </button>
          </div>

        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            Loading transaction records...
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B192C] text-slate-300 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Counterparty / Details</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">PDF Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => {
                  const isCredit = txn.flow_type === 'CREDIT';
                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {txn.transaction_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          txn.transaction_type === 'TRANSFER'
                            ? 'bg-blue-100 text-blue-700'
                            : txn.transaction_type === 'DEPOSIT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {txn.transaction_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {txn.transaction_type === 'TRANSFER' ? (
                          isCredit ? (
                            <div>
                              <span className="font-semibold text-emerald-700">Received from: </span>
                              <span>{txn.sender_name} (#{txn.sender_account_number})</span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-rose-700">Transferred to: </span>
                              <span>{txn.receiver_name} (#{txn.receiver_account_number})</span>
                            </div>
                          )
                        ) : (
                          <span>{txn.remarks || (txn.transaction_type === 'DEPOSIT' ? 'Cash Deposit' : 'Cash Withdrawal')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {txn.remarks || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleString()}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold font-mono text-sm ${
                        isCredit ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isCredit ? '+' : '-'}${parseFloat(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SUCCESS</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => downloadReceiptPDF(txn)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg font-semibold text-[11px] transition inline-flex items-center space-x-1.5"
                          title="Download Receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            No transactions match your search and filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
