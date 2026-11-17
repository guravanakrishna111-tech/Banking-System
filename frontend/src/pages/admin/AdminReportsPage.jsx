import React, { useState } from 'react';
import api, { API_BASE_URL } from '../../api/client';
import { 
  FileSpreadsheet, 
  Download, 
  Users, 
  CreditCard, 
  History, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState('');

  const handleDownload = async (type, filename) => {
    setDownloading(type);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/analytics/export-csv/?type=${type}`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download report.');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Reports & Compliance Exports</h1>
        <p className="text-xs text-slate-500 mt-0.5">Generate exportable audit spreadsheets for compliance, regulators, and analysis</p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Transactions Report */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <History className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Transactions Ledger Report</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export complete transaction history including sender/receiver accounts, amounts, status, timestamps, and remarks.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => handleDownload('transactions', 'transactions_ledger.csv')}
              disabled={downloading === 'transactions'}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {downloading === 'transactions' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing CSV...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Transactions CSV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bank Accounts Report */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Bank Accounts Portfolio</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export all bank accounts, account types (Savings/Current), account balances, IFSC codes, and active status.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => handleDownload('accounts', 'accounts_portfolio.csv')}
              disabled={downloading === 'accounts'}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {downloading === 'accounts' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing CSV...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Accounts CSV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Users Report */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Customer Registry Report</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export all customer master profiles, contact records, phone numbers, addresses, and registration dates.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => handleDownload('users', 'customers_registry.csv')}
              disabled={downloading === 'users'}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {downloading === 'users' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing CSV...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Customers CSV</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
