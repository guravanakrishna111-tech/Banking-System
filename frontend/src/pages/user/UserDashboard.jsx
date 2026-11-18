import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, 
  SendHorizontal, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  PlusCircle, 
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { downloadReceiptPDF } from '../../utils/pdfReceipt';

export default function UserDashboard({ setCurrentTab, onOpenTransfer, onOpenDeposit, onOpenWithdraw, onOpenNewAccount, transactions }) {
  const { user, accounts, currentAccount } = useAuth();

  // Aggregate user balances and flows
  const totalBalance = accounts?.reduce((sum, a) => sum + (a.is_active ? parseFloat(a.balance) : 0), 0) || 0;

  const totalReceived = transactions
    ?.filter((t) => t.flow_type === 'CREDIT' && t.status === 'SUCCESS')
    ?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  const totalSent = transactions
    ?.filter((t) => t.flow_type === 'DEBIT' && t.status === 'SUCCESS')
    ?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0066FF] text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Simulated Online Banking Environment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.first_name || user?.username}!
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Manage your savings, execute atomic transfers, monitor transaction history, and generate verifiable electronic receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenTransfer}
              className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-xl text-xs shadow-md transition flex items-center space-x-2"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Transfer Money</span>
            </button>
            <button
              onClick={onOpenDeposit}
              className="px-4 py-2.5 bg-blue-500/30 hover:bg-blue-500/40 text-white font-semibold rounded-xl text-xs border border-white/20 transition flex items-center space-x-2 backdrop-blur-xs"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Deposit Funds</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Total Available Balance</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center space-x-1">
            <span className="font-semibold text-blue-600">{accounts?.length || 0}</span>
            <span>linked bank accounts</span>
          </div>
        </div>

        {/* Money Received */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Money Received (Credits)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            +${totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Deposits & transfers received
          </div>
        </div>

        {/* Money Transferred */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Money Sent (Debits)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">
            -${totalSent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Transfers & ATM cash withdrawals
          </div>
        </div>

        {/* Current Active Account */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Active Account #{currentAccount?.account_number.slice(-4) || '----'}</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
              ACTIVE
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700 tracking-tight">
            ${parseFloat(currentAccount?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {currentAccount?.account_type || 'Savings'} • IFSC: {currentAccount?.ifsc_code}
          </div>
        </div>
      </div>

      {/* Visual Debit Card + Quick Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Virtual Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#0B192C] via-[#1E3E62] to-[#112A46] text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between min-h-[220px] relative border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest uppercase text-blue-300">Online Banking</span>
            <span className="text-xs font-mono font-semibold text-slate-300">
              {currentAccount?.account_type || 'SAVINGS'}
            </span>
          </div>

          <div className="my-4">
            <div className="text-xs text-slate-400 font-mono">Account Number</div>
            <div className="text-xl sm:text-2xl font-mono tracking-widest font-bold text-white mt-1">
              {currentAccount?.account_number ? (
                <>
                  {currentAccount.account_number.slice(0, 4)}{' '}
                  {currentAccount.account_number.slice(4, 8)}{' '}
                  {currentAccount.account_number.slice(8, 12)}
                </>
              ) : (
                '1001 •••• ••••'
              )}
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-slate-700/80 pt-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Account Holder</div>
              <div className="text-sm font-semibold text-white">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">IFSC Code</div>
              <div className="text-xs font-mono font-bold text-blue-300">
                {currentAccount?.ifsc_code || 'OBMS0001234'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
              <button
                onClick={() => setCurrentTab('accounts')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View All Accounts &rarr;
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={onOpenTransfer}
                className="p-4 rounded-2xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-100 text-left transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
                  <SendHorizontal className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Send Money</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Instant transfer</div>
              </button>

              <button
                onClick={onOpenDeposit}
                className="p-4 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-100 text-left transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Deposit</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Add simulated cash</div>
              </button>

              <button
                onClick={onOpenWithdraw}
                className="p-4 rounded-2xl bg-rose-50/60 hover:bg-rose-100/70 border border-rose-100 text-left transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-3 shadow-md shadow-rose-500/20 group-hover:scale-105 transition">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Withdraw</div>
                <div className="text-[11px] text-slate-500 mt-0.5">ATM simulated cash</div>
              </button>

              <button
                onClick={onOpenNewAccount}
                className="p-4 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 border border-purple-100 text-left transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 shadow-md shadow-purple-500/20 group-hover:scale-105 transition">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">New Account</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Open Savings/Current</div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Transaction engine status: <strong className="text-emerald-600">Operational</strong></span>
            <span>Security protocol: <strong className="text-blue-600">Row-Locked ACID</strong></span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live records of your latest banking operations</p>
          </div>
          <button
            onClick={() => setCurrentTab('transactions')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Full Transaction History &rarr;
          </button>
        </div>

        {transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Counterparty / Description</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((txn) => {
                  const isCredit = txn.flow_type === 'CREDIT';
                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {txn.transaction_id}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          txn.transaction_type === 'TRANSFER'
                            ? 'bg-blue-100 text-blue-700'
                            : txn.transaction_type === 'DEPOSIT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {txn.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {txn.transaction_type === 'TRANSFER' ? (
                          isCredit ? `From: ${txn.sender_name} (${txn.sender_account_number})` : `To: ${txn.receiver_name} (${txn.receiver_account_number})`
                        ) : (
                          txn.remarks || txn.transaction_type
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold font-mono ${
                        isCredit ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isCredit ? '+' : '-'}${parseFloat(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SUCCESS</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => downloadReceiptPDF(txn)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Download Receipt PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No transactions found yet. Try transferring or depositing funds.
          </div>
        )}
      </div>
    </div>
  );
}
