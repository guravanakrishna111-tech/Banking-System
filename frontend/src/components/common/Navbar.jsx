import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Bell, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck, 
  CreditCard,
  Menu
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, onOpenNotifications }) {
  const { user, isAdmin, accounts, currentAccount, setCurrentAccount, unreadCount, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#0B192C] text-white border-b border-slate-800 shadow-md">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Online Banking System
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                Simulated Portal
              </span>
            </div>
          </div>
        </div>

        {/* Center: Active Account Selector (for Customers with multiple accounts) */}
        {!isAdmin && accounts && accounts.length > 0 && (
          <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Active Account:</span>
            <select
              value={currentAccount?.id || ''}
              onChange={(e) => {
                const found = accounts.find((a) => a.id === parseInt(e.target.value));
                if (found) setCurrentAccount(found);
              }}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                  {acc.account_type} • #{acc.account_number.slice(-4)} (${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right: Notifications, User Pill & Logout */}
        <div className="flex items-center space-x-3">
          
          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Tag */}
          <div className="hidden sm:flex items-center space-x-2.5 pl-2 border-l border-slate-700">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-blue-300 font-semibold text-xs border border-slate-600">
              {isAdmin ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <UserIcon className="w-4 h-4 text-blue-400" />}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-white leading-tight">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {isAdmin ? 'Administrator' : 'Verified Customer'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-red-300 hover:text-white hover:bg-red-900/40 border border-red-500/30 rounded-lg transition"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>
      </div>
    </header>
  );
}
