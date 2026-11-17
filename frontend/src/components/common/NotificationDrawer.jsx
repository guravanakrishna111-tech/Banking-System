import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Bell,
  CheckCheck,
  SendHorizontal,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldAlert,
  Info,
  CreditCard
} from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsRead } = useAuth();

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'TRANSFER':
      case 'DEBIT':
        return <SendHorizontal className="w-4 h-4 text-orange-400" />;
      case 'CREDIT':
      case 'DEPOSIT':
        return <ArrowDownCircle className="w-4 h-4 text-emerald-400" />;
      case 'WITHDRAWAL':
        return <ArrowUpCircle className="w-4 h-4 text-rose-400" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'ACCOUNT':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-[#0B192C] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-base">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="flex items-center space-x-1 text-xs text-blue-300 hover:text-white transition px-2 py-1 rounded bg-slate-800"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markNotificationAsRead(n.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    n.is_read
                      ? 'bg-slate-50 border-slate-200 text-slate-600'
                      : 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-white shadow-xs border border-slate-100">
                      {getIcon(n.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
