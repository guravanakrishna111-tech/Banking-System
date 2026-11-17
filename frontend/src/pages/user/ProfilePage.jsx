import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { 
  User as UserIcon, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard 
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshProfile, isAdmin } = useAuth();

  // Profile update form
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      await api.patch('/accounts/auth/profile/', {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        address: address,
      });
      setProfileSuccess('Profile details updated successfully.');
      await refreshProfile();
    } catch (err) {
      setProfileError('Failed to update profile information.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    setPwSuccess('');
    setPwError('');

    if (newPassword !== confirmNewPassword) {
      setPwError('New passwords do not match.');
      setPwSaving(false);
      return;
    }

    try {
      await api.post('/accounts/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      setPwSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      const msg = err.response?.data?.current_password?.[0] || 
                  err.response?.data?.new_password?.[0] || 
                  'Password update failed.';
      setPwError(msg);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {isAdmin ? 'Admin Profile & Security' : 'My Profile & Security'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your contact information, credentials, and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs h-fit space-y-5">
          <div className="text-center pb-5 border-b border-slate-100">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-700 to-indigo-500 rounded-3xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30 mb-3">
              {user?.first_name ? user.first_name.charAt(0) : user?.username?.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-bold text-base text-slate-900">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">@{user?.username}</div>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {isAdmin ? 'Bank Administrator' : 'Verified Banking Customer'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center space-x-3 text-slate-600">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>{user?.email || 'No email registered'}</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-600">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{user?.phone_number || 'No phone registered'}</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-600">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{user?.address || 'No address provided'}</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ID Proof: {user?.id_proof_number || 'SIMULATED-KYC-VERIFIED'}</span>
            </div>
          </div>

          {!isAdmin && (
            <div className="pt-4 border-t border-slate-100 text-xs">
              <div className="text-slate-500 text-[11px]">Total Net Worth across accounts:</div>
              <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                ${parseFloat(user?.total_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Edit Profile & Change Password */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Edit Profile Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <span>Personal Details</span>
            </h3>

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Email (Read-only)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows="2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
                >
                  {profileSaving ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Change Security Password</span>
            </h3>

            {pwSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}
            {pwError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition"
                >
                  {pwSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
