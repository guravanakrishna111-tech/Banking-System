import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, PlusCircle, CheckCircle2, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function AccountsPage({ onOpenNewAccount, onOpenTransfer }) {
  const { accounts, currentAccount, setCurrentAccount, user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Bank Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your active Savings and Current checking accounts</p>
        </div>
        <button
          onClick={onOpenNewAccount}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Open New Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const isSelected = currentAccount?.id === acc.id;
          return (
            <div
              key={acc.id}
              className={`rounded-3xl p-6 border transition relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                isSelected
                  ? 'bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white border-blue-600/40 shadow-xl ring-2 ring-blue-500/30'
                  : 'bg-white text-slate-800 border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    isSelected ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {acc.account_type}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {acc.is_active ? 'ACTIVE' : 'FROZEN'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] uppercase tracking-wider opacity-60">Account Number</div>
                <div className={`text-lg font-mono font-bold tracking-widest mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {acc.account_number.slice(0, 4)} {acc.account_number.slice(4, 8)} {acc.account_number.slice(8, 12)}
                </div>

                <div className="mt-4">
                  <div className="text-[11px] opacity-60">Available Balance</div>
                  <div className={`text-2xl font-bold font-mono ${isSelected ? 'text-emerald-400' : 'text-blue-700'}`}>
                    ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal opacity-70">USD</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/20 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] opacity-60">IFSC Code</div>
                  <div className="font-mono font-bold text-xs">{acc.ifsc_code}</div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isSelected && (
                    <button
                      onClick={() => setCurrentAccount(acc)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCurrentAccount(acc);
                      onOpenTransfer();
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      isSelected ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                    title="Send from this account"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/70 flex items-start space-x-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="leading-relaxed">
          <strong>Multi-Account Management:</strong> You can open both Savings and Current accounts under your verified profile. Transfers, deposits, and cash withdrawals can be independently executed on any active account.
        </p>
      </div>
    </div>
  );
}
