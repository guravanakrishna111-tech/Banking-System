import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  UserCheck,
  CreditCard,
  SendHorizontal,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Users,
  Bell,
  LogOut,
  ShieldAlert,
  BarChart3,
  FileSpreadsheet,
  Layers,
  X
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, isOpen, onClose }) {
  const { isAdmin, unreadCount, logout } = useAuth();

  const userMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'My Bank Accounts', icon: CreditCard },
    { id: 'transfer', label: 'Transfer Money', icon: SendHorizontal },
    { id: 'deposit', label: 'Deposit Money', icon: ArrowDownCircle },
    { id: 'withdraw', label: 'Withdraw Money', icon: ArrowUpCircle },
    { id: 'transactions', label: 'Transaction History', icon: History },
    { id: 'beneficiaries', label: 'Beneficiary Management', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'My Profile', icon: UserCheck },
  ];

  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { id: 'admin-users', label: 'Manage Users', icon: Users },
    { id: 'admin-accounts', label: 'Manage Bank Accounts', icon: CreditCard },
    { id: 'admin-transactions', label: 'All Transactions', icon: History },
    { id: 'admin-reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'admin-audit', label: 'Audit Logs', icon: Layers },
    { id: 'admin-broadcast', label: 'Announcements & Alerts', icon: Bell },
    { id: 'admin-profile', label: 'Admin Profile', icon: ShieldAlert },
  ];

  const items = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0B192C] text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-white text-base">Navigation</span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Tag */}
        <div className="px-5 py-4 border-b border-slate-800/80">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Current Portal
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
              }`}
            />
            <span className="text-sm font-semibold text-white">
              {isAdmin ? 'Bank Administration' : 'Customer Banking'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-blue-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Simulation Banner & Logout Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-300">
            <div className="font-semibold text-blue-300 mb-0.5">Academic Project</div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Safe simulated environment with row-locked atomic transfers.
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
