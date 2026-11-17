import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { X, ArrowUpCircle, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react';
import { downloadReceiptPDF } from '../../utils/pdfReceipt';

export default function WithdrawModal({ isOpen, onClose, onSuccess }) {
  const { accounts, currentAccount, refreshAccounts, refreshNotifications } = useAuth();
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdTxn, setCreatedTxn] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAccountId(currentAccount?.id || (accounts[0]?.id || ''));
      setAmount('');
      setRemarks('');
      setError('');
      setCreatedTxn(null);
    }
  }, [isOpen, currentAccount, accounts]);

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === parseInt(accountId));
  const availableBal = parseFloat(selectedAccount?.balance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }
    if (val > availableBal) {
      setError(`Insufficient balance. Maximum withdrawable: $${availableBal.toFixed(2)}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/transactions/withdraw/', {
        account_id: parseInt(accountId),
        amount: val,
        remarks: remarks.trim() || 'Simulated Cash/ATM Withdrawal',
      });
      setCreatedTxn(res.data.transaction);
      await refreshAccounts();
      await refreshNotifications();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.amount?.[0] || err.response?.data?.error || 'Withdrawal failed.');
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
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <ArrowUpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Withdraw Money</h3>
              <p className="text-xs text-slate-300">Simulated ATM / Cash Withdrawal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!createdTxn ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Debiting Account
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type} • #{acc.account_number} (Available: ${parseFloat(acc.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>Available Balance:</span>
                  <strong className="text-slate-900 font-mono">${availableBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Withdrawal Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="200.00"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remarks / Channel
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. ATM withdrawal, Counter cash"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
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
                  disabled={loading || !amount || parseFloat(amount) > availableBal}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 disabled:opacity-50 transition flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispensing Funds...</span>
                    </>
                  ) : (
                    <span>Confirm Withdrawal</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Withdrawal Successful!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  ${parseFloat(createdTxn.amount).toFixed(2)} has been withdrawn from your account.
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-100 text-slate-800 font-mono text-xs rounded-lg">
                  Ref: {createdTxn.transaction_id}
                </div>
              </div>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => downloadReceiptPDF(createdTxn)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Receipt</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
