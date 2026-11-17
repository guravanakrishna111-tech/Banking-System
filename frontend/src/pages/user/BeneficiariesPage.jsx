import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  Users, 
  PlusCircle, 
  Trash2, 
  SendHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  UserCheck, 
  X,
  CreditCard
} from 'lucide-react';

export default function BeneficiariesPage({ onTransferToBeneficiary }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [accountNumber, setAccountNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/beneficiaries/');
      setBeneficiaries(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch beneficiaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleVerify = async () => {
    if (!accountNumber.trim()) return;
    setVerifying(true);
    setVerifyError('');
    setVerifiedInfo(null);

    try {
      const res = await api.get(`/accounts/verify/?account_number=${accountNumber.trim()}`);
      setVerifiedInfo(res.data);
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Account not found or inactive.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!verifiedInfo) {
      setSaveError('Please verify the account first.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      await api.post('/accounts/beneficiaries/', {
        account_number: verifiedInfo.account_number,
        beneficiary_name: verifiedInfo.account_holder,
        bank_name: 'Online Banking System',
        ifsc_code: verifiedInfo.ifsc_code,
        nickname: nickname.trim() || verifiedInfo.account_holder,
      });

      setIsModalOpen(false);
      setAccountNumber('');
      setNickname('');
      setVerifiedInfo(null);
      await fetchBeneficiaries();
    } catch (err) {
      setSaveError(err.response?.data?.account_number?.[0] || 'Failed to add beneficiary.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this beneficiary?')) return;
    try {
      await api.delete(`/accounts/beneficiaries/${id}/`);
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete beneficiary:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Beneficiary Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Save frequent transfer recipients for 1-click money transfers</p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setAccountNumber('');
            setNickname('');
            setVerifiedInfo(null);
            setVerifyError('');
            setSaveError('');
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Beneficiary</span>
        </button>
      </div>

      {/* Beneficiaries Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Loading beneficiaries...
        </div>
      ) : beneficiaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {beneficiaries.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {b.beneficiary_name.charAt(0)}
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete beneficiary"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{b.beneficiary_name}</h3>
                {b.nickname && (
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md mt-1">
                    {b.nickname}
                  </span>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account:</span>
                    <strong className="font-mono text-slate-800">{b.account_number}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IFSC Code:</span>
                    <span className="font-mono text-slate-600">{b.ifsc_code}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3">
                <button
                  onClick={() => onTransferToBeneficiary(b.account_number)}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2"
                >
                  <SendHorizontal className="w-3.5 h-3.5" />
                  <span>Transfer Money</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Beneficiaries Added Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add frequent recipients to instantly transfer funds without typing the 12-digit account number every time.
          </p>
        </div>
      )}

      {/* Add Beneficiary Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Add Beneficiary</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {saveError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  {saveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Beneficiary Account Number
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setVerifiedInfo(null);
                      setVerifyError('');
                    }}
                    placeholder="Enter 12-digit account number"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying || !accountNumber.trim()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition flex items-center space-x-1"
                  >
                    {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                    <span>Verify</span>
                  </button>
                </div>

                {verifiedInfo && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{verifiedInfo.account_holder}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      {verifiedInfo.account_type} • IFSC: {verifiedInfo.ifsc_code}
                    </div>
                  </div>
                )}

                {verifyError && (
                  <div className="mt-2 text-xs text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{verifyError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nickname (Optional)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Landlord, Business Partner"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !verifiedInfo}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition"
                >
                  {saving ? 'Saving...' : 'Add Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
