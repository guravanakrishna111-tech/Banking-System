import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { 
  SendHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  FileText,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { downloadReceiptPDF } from '../../utils/pdfReceipt';

export default function TransferPage({ prefilledReceiver = '', onDone }) {
  const { accounts, currentAccount, refreshAccounts, refreshNotifications } = useAuth();

  const [senderAccountId, setSenderAccountId] = useState('');
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  const [verifying, setVerifying] = useState(false);
  const [verifiedReceiver, setVerifiedReceiver] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  const [step, setStep] = useState('form');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdTxn, setCreatedTxn] = useState(null);

  // Synchronize sender account whenever accounts or currentAccount load/change
  useEffect(() => {
    const activeId = currentAccount?.id || (accounts && accounts.length > 0 ? accounts[0].id : '');
    setSenderAccountId(String(activeId || ''));
  }, [currentAccount, accounts]);

  useEffect(() => {
    if (prefilledReceiver) {
      const clean = String(prefilledReceiver).replace(/[\s-]/g, '');
      setReceiverAccountNumber(clean);
      verifyReceiver(clean);
    }
  }, [prefilledReceiver]);

  const selectedSenderAccount = accounts?.find(
    (a) => String(a.id) === String(senderAccountId)
  ) || accounts?.[0];

  const senderBalance = parseFloat(selectedSenderAccount?.balance || 0);
  const parsedAmount = parseFloat(amount || 0);

  const handleAccountChange = (val) => {
    const clean = val.replace(/[\s-]/g, '');
    setReceiverAccountNumber(clean);
    setVerifyError('');
    if (clean.length === 12) {
      verifyReceiver(clean);
    } else {
      setVerifiedReceiver(null);
    }
  };

  const verifyReceiver = async (accNum) => {
    const raw = accNum !== undefined ? accNum : receiverAccountNumber;
    const cleanNum = String(raw || '').replace(/[\s-]/g, '').trim();
    if (!cleanNum) return null;

    setVerifying(true);
    setVerifyError('');

    try {
      const res = await api.get(`/accounts/verify/?account_number=${cleanNum}`);
      setVerifiedReceiver(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Account number not found or inactive.';
      setVerifyError(msg);
      setVerifiedReceiver(null);
      return null;
    } finally {
      setVerifying(false);
    }
  };

  const handleProceedToConfirm = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const activeSenderId = senderAccountId || selectedSenderAccount?.id;
    if (!activeSenderId) {
      setSubmitError('Please select a sender account.');
      return;
    }

    const cleanReceiverNum = receiverAccountNumber.replace(/[\s-]/g, '').trim();
    if (!cleanReceiverNum) {
      setSubmitError('Please enter a recipient account number.');
      return;
    }

    if (selectedSenderAccount?.account_number === cleanReceiverNum) {
      setSubmitError('Cannot transfer money to the same account.');
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setSubmitError('Please enter a valid transfer amount greater than $0.');
      return;
    }

    if (parsedAmount > senderBalance) {
      setSubmitError(`Insufficient funds. Your available balance is $${senderBalance.toFixed(2)}.`);
      return;
    }

    // Auto-verify if not verified
    let receiverData = verifiedReceiver;
    if (!receiverData || receiverData.account_number !== cleanReceiverNum) {
      receiverData = await verifyReceiver(cleanReceiverNum);
    }

    if (!receiverData) {
      setSubmitError('Cannot proceed: Recipient account was not found or is inactive.');
      return;
    }

    if (!receiverData.is_active) {
      setSubmitError('The destination account is currently inactive or frozen.');
      return;
    }

    setStep('confirm');
  };

  const handleExecuteTransfer = async () => {
    setSubmitting(true);
    setSubmitError('');

    const activeSenderId = senderAccountId || selectedSenderAccount?.id;
    const cleanReceiverNum = receiverAccountNumber.replace(/[\s-]/g, '').trim();

    try {
      const res = await api.post('/transactions/transfer/', {
        sender_account_id: parseInt(activeSenderId),
        receiver_account_number: cleanReceiverNum,
        amount: parsedAmount,
        remarks: remarks.trim(),
      });

      setCreatedTxn(res.data.transaction);
      setStep('success');
      await refreshAccounts();
      await refreshNotifications();
    } catch (err) {
      const msg = err.response?.data?.amount?.[0] || 
                  err.response?.data?.receiver_account_number?.[0] || 
                  err.response?.data?.sender_account?.[0] || 
                  err.response?.data?.error || 
                  'Transfer failed. Please check details and try again.';
      setSubmitError(msg);
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Transfer Money</h1>
        <p className="text-xs text-slate-500 mt-0.5">Secure, atomic funds transfer to any verified active bank account</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        {step === 'form' && (
          <form onSubmit={handleProceedToConfirm} className="space-y-5">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Sender Account */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Debiting Bank Account
              </label>
              <select
                value={senderAccountId || selectedSenderAccount?.id || ''}
                onChange={(e) => setSenderAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accounts?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_type} • #{acc.account_number} (Available: ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Available Balance:</span>
                <strong className="text-blue-600 font-mono">${senderBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong>
              </div>
            </div>

            {/* Beneficiary Account Number with Verification */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Recipient Account Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={receiverAccountNumber}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  onBlur={() => receiverAccountNumber.trim() && verifyReceiver()}
                  placeholder="Enter 12-digit account number (e.g. 1001...)"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => verifyReceiver()}
                  disabled={verifying || !receiverAccountNumber.trim()}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition flex items-center space-x-1.5"
                >
                  {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span>Verify</span>
                </button>
              </div>

              {verifying && (
                <div className="mt-2 text-xs text-blue-600 flex items-center space-x-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating recipient account with core banking records...</span>
                </div>
              )}

              {verifiedReceiver && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{verifiedReceiver.account_holder}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      {verifiedReceiver.account_type} • IFSC: {verifiedReceiver.ifsc_code}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded-md">
                    VERIFIED
                  </span>
                </div>
              )}

              {verifyError && (
                <div className="mt-2 text-xs text-rose-600 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{verifyError}</span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Amount ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transaction Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Freelance invoice, Rent payment"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={verifying || !receiverAccountNumber.trim() || parsedAmount <= 0 || parsedAmount > senderBalance}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center space-x-1.5"
              >
                {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Review Transfer Details &rarr;</span>
              </button>
            </div>
          </form>
        )}

        {step === 'confirm' && (
          <div className="space-y-5">
            <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl">
              <div className="text-xs font-bold text-blue-900 mb-4 flex items-center space-x-1.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Confirm Atomic Money Transfer</span>
              </div>
              
              <div className="space-y-2.5 text-xs text-slate-700 divide-y divide-blue-200/60">
                <div className="pt-1 flex justify-between">
                  <span className="text-slate-500">Debited From:</span>
                  <span className="font-semibold">{selectedSenderAccount?.account_type} (#{selectedSenderAccount?.account_number})</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Beneficiary Name:</span>
                  <strong className="text-emerald-700">{verifiedReceiver?.account_holder}</strong>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Beneficiary Account:</span>
                  <span className="font-mono font-semibold">{receiverAccountNumber}</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-500">Transfer Amount:</span>
                  <span className="text-lg font-extrabold font-mono text-blue-700">${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Remarks:</span>
                  <span>{remarks || 'None'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Closing Balance After Transfer:</span>
                  <span className="font-mono font-bold text-slate-900">${(senderBalance - parsedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                &larr; Back to Edit
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Atomic Transfer...</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-3.5 h-3.5" />
                    <span>Confirm & Transfer Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && createdTxn && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-900">Transfer Successfully Completed!</h4>
              <p className="text-xs text-slate-500 mt-1">
                ${parsedAmount.toFixed(2)} has been credited to {verifiedReceiver?.account_holder}.
              </p>
              <div className="mt-2 inline-block px-3 py-1 bg-slate-100 text-slate-800 font-mono text-xs rounded-lg">
                Reference ID: {createdTxn.transaction_id}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => downloadReceiptPDF(createdTxn)}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Download Electronic Receipt (PDF)</span>
              </button>
              <button
                onClick={() => {
                  setStep('form');
                  setAmount('');
                  setRemarks('');
                  setReceiverAccountNumber('');
                  setVerifiedReceiver(null);
                  if (onDone) onDone();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
              >
                Make Another Transfer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
