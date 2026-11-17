import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { X, PlusCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function NewAccountModal({ isOpen, onClose, onSuccess }) {
  const { refreshAccounts, refreshNotifications } = useAuth();
  const [accountType, setAccountType] = useState('SAVINGS');
  const [initialDeposit, setInitialDeposit] = useState('500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdAccount, setCreatedAccount] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const deposit = parseFloat(initialDeposit);
    if (deposit < 0) {
      setError('Opening deposit cannot be negative.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/accounts/my-accounts/', {
        account_type: accountType,
        initial_deposit: deposit,
      });
      setCreatedAccount(res.data);
      await refreshAccounts();
      await refreshNotifications();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.initial_deposit?.[0] || 'Failed to open new bank account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Open New Bank Account</h3>
              <p className="text-xs text-slate-300">Instant multi-account creation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!createdAccount ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('SAVINGS')}
                    className={`p-3 rounded-xl border text-left transition ${
                      accountType === 'SAVINGS'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-semibold ring-2 ring-purple-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Savings Account</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Earn interest on balances</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('CURRENT')}
                    className={`p-3 rounded-xl border text-left transition ${
                      accountType === 'CURRENT'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-semibold ring-2 ring-purple-600/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Current Account</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">High transaction volume</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Initial Deposit Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Unique 12-digit account number and IFSC code will be automatically assigned.
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 disabled:opacity-50 transition flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Opening Account...</span>
                    </>
                  ) : (
                    <span>Open Account Now</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">New Account Active!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your new {createdAccount.account_type_display} is ready to use.
                </p>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Number:</span>
                    <strong className="font-mono text-purple-700">{createdAccount.account_number}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC Code:</span>
                    <strong className="font-mono">{createdAccount.ifsc_code}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Opening Balance:</span>
                    <strong className="text-emerald-600 font-mono">${parseFloat(createdAccount.balance).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
