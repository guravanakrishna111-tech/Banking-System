import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import api from './api/client';

// Common Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import NotificationDrawer from './components/common/NotificationDrawer';

// User Modals & Pages
import TransferModal from './components/user/TransferModal';
import DepositModal from './components/user/DepositModal';
import WithdrawModal from './components/user/WithdrawModal';
import NewAccountModal from './components/user/NewAccountModal';
import UserDashboard from './pages/user/UserDashboard';
import AccountsPage from './pages/user/AccountsPage';
import TransferPage from './pages/user/TransferPage';
import TransactionsPage from './pages/user/TransactionsPage';
import BeneficiariesPage from './pages/user/BeneficiariesPage';
import ProfilePage from './pages/user/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAccountsPage from './pages/admin/AdminAccountsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import AdminBroadcastPage from './pages/admin/AdminBroadcastPage';

// Auth Pages
import UserLogin from './pages/auth/UserLogin';
import AdminLogin from './pages/auth/AdminLogin';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

export default function App() {
  const { user, token, isAdmin, loading } = useAuth();

  // Non-auth views: 'login' | 'admin-login' | 'register' | 'forgot'
  const [authView, setAuthView] = useState('login');

  // Authenticated tab
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [prefilledReceiver, setPrefilledReceiver] = useState('');

  // Transactions list for dashboard
  const [dashboardTransactions, setDashboardTransactions] = useState([]);

  useEffect(() => {
    if (token) {
      if (isAdmin) {
        setCurrentTab('admin-dashboard');
      } else {
        setCurrentTab('dashboard');
        fetchUserTransactions();
      }
    }
  }, [token, isAdmin]);

  const fetchUserTransactions = async () => {
    try {
      const res = await api.get('/transactions/history/');
      setDashboardTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard transactions:', err);
    }
  };

  const handleTransferToBeneficiary = (accountNum) => {
    setPrefilledReceiver(accountNum);
    setIsTransferOpen(true);
  };

  // If initial auth check is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B192C] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-blue-200">Initializing Online Banking System...</span>
        </div>
      </div>
    );
  }

  // If not logged in, show Auth screens
  if (!token) {
    if (authView === 'admin-login') {
      return <AdminLogin onSwitchToUserLogin={() => setAuthView('login')} />;
    }
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot') {
      return <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />;
    }
    return (
      <UserLogin
        onSwitchToRegister={() => setAuthView('register')}
        onSwitchToForgot={() => setAuthView('forgot')}
        onSwitchToAdmin={() => setAuthView('admin-login')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Role-aware Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            if (tab === 'deposit') {
              setIsDepositOpen(true);
            } else if (tab === 'withdraw') {
              setIsWithdrawOpen(true);
            } else if (tab === 'transfer') {
              setIsTransferOpen(true);
            } else if (tab === 'notifications') {
              setIsNotificationOpen(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Customer Views */}
            {!isAdmin && (
              <>
                {currentTab === 'dashboard' && (
                  <UserDashboard
                    setCurrentTab={setCurrentTab}
                    onOpenTransfer={() => {
                      setPrefilledReceiver('');
                      setIsTransferOpen(true);
                    }}
                    onOpenDeposit={() => setIsDepositOpen(true)}
                    onOpenWithdraw={() => setIsWithdrawOpen(true)}
                    onOpenNewAccount={() => setIsNewAccountOpen(true)}
                    transactions={dashboardTransactions}
                  />
                )}
                {currentTab === 'accounts' && (
                  <AccountsPage
                    onOpenNewAccount={() => setIsNewAccountOpen(true)}
                    onOpenTransfer={() => {
                      setPrefilledReceiver('');
                      setIsTransferOpen(true);
                    }}
                  />
                )}
                {currentTab === 'transfer' && (
                  <TransferPage
                    prefilledReceiver={prefilledReceiver}
                    onDone={() => {
                      fetchUserTransactions();
                      setCurrentTab('dashboard');
                    }}
                  />
                )}
                {currentTab === 'transactions' && <TransactionsPage />}
                {currentTab === 'beneficiaries' && (
                  <BeneficiariesPage onTransferToBeneficiary={handleTransferToBeneficiary} />
                )}
                {currentTab === 'profile' && <ProfilePage />}
              </>
            )}

            {/* Admin Views */}
            {isAdmin && (
              <>
                {currentTab === 'admin-dashboard' && (
                  <AdminDashboard setCurrentTab={setCurrentTab} />
                )}
                {currentTab === 'admin-users' && <AdminUsersPage />}
                {currentTab === 'admin-accounts' && <AdminAccountsPage />}
                {currentTab === 'admin-transactions' && <AdminTransactionsPage />}
                {currentTab === 'admin-reports' && <AdminReportsPage />}
                {currentTab === 'admin-audit' && <AdminAuditPage />}
                {currentTab === 'admin-broadcast' && <AdminBroadcastPage />}
                {currentTab === 'admin-profile' && <ProfilePage />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Slide-over Notifications */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Global Action Modals */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        initialReceiverNumber={prefilledReceiver}
        onSuccess={() => {
          fetchUserTransactions();
        }}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={() => {
          fetchUserTransactions();
        }}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={() => {
          fetchUserTransactions();
        }}
      />

      <NewAccountModal
        isOpen={isNewAccountOpen}
        onClose={() => setIsNewAccountOpen(false)}
      />
    </div>
  );
}
