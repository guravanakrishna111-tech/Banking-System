import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { 
  X, 
  SendHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  FileText,
  UserCheck
} from 'lucide-react';
import { downloadReceiptPDF } from '../../utils/pdfReceipt';

export default function TransferModal({ isOpen, onClose, onSuccess, initialReceiverNumber = '' }) {
  const { accounts, currentAccount, refreshAccounts, refreshNotifications } = useAuth();

  const [senderAccountId, setSenderAccountId] = useState('');
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  // Receiver verification state
  const [verifying, setVerifying] = useState(false);
  const [verifiedReceiver, setVerifiedReceiver] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Flow step: 'form' | 'confirm' | 'success'
  const [step, setStep] = useState('form');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdTxn, setCreatedTxn] = useState(null);

  // Sync state whenever modal opens or accounts/currentAccount update
  useEffect(() => {
    if (isOpen) {
      const activeId = currentAccount?.id || (accounts && accounts.length > 0 ? accounts[0].id : '');
      setSenderAccountId(String(activeId || ''));
      const cleanInitial = String(initialReceiverNumber || '').replace(/[\s-]/g, '');
      setReceiverAccountNumber(cleanInitial);
      setAmount('');
      setRemarks('');
      setVerifiedReceiver(null);
      setVerifyError('');
      setSubmitError('');
      setStep('form');
      setCreatedTxn(null);

      if (cleanInitial) {
        verifyReceiver(cleanInitial);
      }
    }
  }, [isOpen, initialReceiverNumber, currentAccount, accounts]);

  // Also auto-verify when typing 12 alphanumeric characters
  const handleAccountChange = (val) => {
    // Strip spaces and hyphens
    const clean = val.replace(/[\s-]/g, '');
    setReceiverAccountNumber(clean);
    setVerifyError('');
    if (clean.length === 12) {
      verifyReceiver(clean);
    } else {
      setVerifiedReceiver(null);
    }
  };

  if (!isOpen) return null;

  const selectedSenderAccount = accounts?.find(
    (a) => String(a.id) === String(senderAccountId)
  ) || accounts?.[0];

  const senderBalance = parseFloat(selectedSenderAccount?.balance || 0);
  const parsedAmount = parseFloat(amount || 0);

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
      const msg = err.response?.data?.error || 'Account number not found or is inactive.';
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
      setSubmitError('Please select a valid sender account.');
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

    // Auto-verify receiver right now if not yet verified
    let receiverData = verifiedReceiver;
    if (!receiverData || receiverData.account_number !== cleanReceiverNum) {
      receiverData = await verifyReceiver(cleanReceiverNum);
    }

    if (!receiverData) {
      setSubmitError('Cannot proceed: Recipient account was not found or is inactive.');
      return;
    }

    if (!receiverData.is_active) {
      setSubmitError('Cannot transfer funds to an inactive or frozen account.');
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
      if (onSuccess) onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <SendHorizontal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Transfer Money</h3>
              <p className="text-xs text-slate-300">Atomic instant bank transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* STEP 1: FORM INPUT */}
          {step === 'form' && (
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Sender Account */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Debiting Account
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
                  <strong className="text-blue-600 font-mono">${senderBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* Receiver Account Number with Verification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Recipient Bank Account Number
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

                {/* Receiver verification display */}
                {verifying && (
                  <div className="mt-2 text-xs text-blue-600 flex items-center space-x-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying recipient details with database...</span>
                  </div>
                )}

                {verifiedReceiver && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
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
                  Transfer Amount ($ USD)
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
                {parsedAmount > senderBalance && (
                  <div className="mt-1 text-xs text-rose-600">
                    Amount exceeds available balance of ${senderBalance.toFixed(2)}.
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remarks / Note (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Rent, consulting fee, loan repayment"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
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
                  disabled={verifying || !receiverAccountNumber.trim() || parsedAmount <= 0 || parsedAmount > senderBalance}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center space-x-1.5"
                >
                  {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Review Transfer &rarr;</span>
                </button>
              </div>

            </form>
          )}

          {/* STEP 2: REVIEW & CONFIRMATION */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
                <div className="text-xs font-bold text-blue-900 mb-3 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Confirm Transfer Details</span>
                </div>
                
                <div className="space-y-2 text-xs text-slate-700 divide-y divide-blue-200/60">
                  <div className="pt-1 flex justify-between">
                    <span className="text-slate-500">From Account:</span>
                    <span className="font-semibold">{selectedSenderAccount?.account_type} (#{selectedSenderAccount?.account_number})</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Recipient Name:</span>
                    <strong className="text-emerald-700">{verifiedReceiver?.account_holder}</strong>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Recipient Account:</span>
                    <span className="font-mono">{receiverAccountNumber}</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-500">Transfer Amount:</span>
                    <span className="text-base font-extrabold font-mono text-blue-700">${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Remarks:</span>
                    <span>{remarks || 'None'}</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Remaining Balance:</span>
                    <span className="font-mono text-slate-900">${(senderBalance - parsedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl">
                Transactions are atomic and immutable once processed.
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

          {/* STEP 3: SUCCESS */}
          {step === 'success' && createdTxn && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">Transfer Successful!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  ${parsedAmount.toFixed(2)} has been transferred to {verifiedReceiver?.account_holder}.
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
                  <span>Download PDF Receipt</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
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
