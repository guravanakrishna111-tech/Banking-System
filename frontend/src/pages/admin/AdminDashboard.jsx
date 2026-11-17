import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  Users, 
  CreditCard, 
  SendHorizontal, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  TrendingUp, 
  ShieldCheck, 
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard({ setCurrentTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard-stats/');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="text-center py-24 text-slate-400 text-xs">
        Loading admin management analytics...
      </div>
    );
  }

  const { kpis, daily_chart, account_types, top_accounts } = data;

  // Chart 1: 7-Day Trend Line
  const lineChartData = {
    labels: daily_chart.labels,
    datasets: [
      {
        label: 'Money Transferred ($)',
        data: daily_chart.transfers,
        borderColor: '#0066FF',
        backgroundColor: 'rgba(0, 102, 255, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Deposits ($)',
        data: daily_chart.deposits,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Chart 2: Deposits vs Withdrawals Comparison
  const barChartData = {
    labels: daily_chart.labels,
    datasets: [
      {
        label: 'Deposits ($)',
        data: daily_chart.deposits,
        backgroundColor: '#10B981',
        borderRadius: 6,
      },
      {
        label: 'Withdrawals ($)',
        data: daily_chart.withdrawals,
        backgroundColor: '#F43F5E',
        borderRadius: 6,
      },
    ],
  };

  // Chart 3: Account Types Distribution
  const doughnutData = {
    labels: ['Savings Accounts', 'Current Accounts'],
    datasets: [
      {
        data: [account_types.savings, account_types.current],
        backgroundColor: ['#0066FF', '#8B5CF6'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0B192C] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Master Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Banking Operations Dashboard
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time audit control, user account monitoring, system-wide transaction metrics, and liquidity oversight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentTab('admin-reports')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Registered Customers</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{kpis.total_users}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active customer profiles</div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Total Accounts</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700 font-mono">{kpis.total_accounts}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex space-x-2">
            <span className="text-emerald-600 font-semibold">{kpis.active_accounts} Active</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">{kpis.inactive_accounts} Frozen</span>
          </div>
        </div>

        {/* Total Transferred */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Volume Transferred</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <SendHorizontal className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono">
            ${parseFloat(kpis.total_transferred).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Inter-account transfers</div>
        </div>

        {/* Total System Transactions */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Total Transactions</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">{kpis.total_transactions}</div>
          <div className="text-[11px] text-slate-400 mt-1">All debit/credit records</div>
        </div>
      </div>

      {/* Secondary KPIs: Deposits & Withdrawals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Deposits Processed</div>
            <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
              ${parseFloat(kpis.total_deposits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Withdrawals Processed</div>
            <div className="text-2xl font-bold text-rose-600 font-mono mt-1">
              ${parseFloat(kpis.total_withdrawals).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Line: Daily Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">7-Day Activity Trends</h3>
              <p className="text-xs text-slate-500">Transfers vs Deposits daily volume</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* Doughnut: Account Types */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Account Portfolio</h3>
            <p className="text-xs text-slate-500 mb-4">Savings vs Current accounts</p>
            <div className="h-48 relative flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                }}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-around text-xs text-slate-600">
            <div>Savings: <strong>{account_types.savings}</strong></div>
            <div>Current: <strong>{account_types.current}</strong></div>
          </div>
        </div>

      </div>

      {/* Chart 2: Deposits vs Withdrawals & Top Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposits vs Withdrawals */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 mb-1">Deposits vs Withdrawals</h3>
          <p className="text-xs text-slate-500 mb-4">Liquidity comparison across past 7 days</p>
          <div className="h-60">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* Most Active Accounts Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Most Active Accounts</h3>
                <p className="text-xs text-slate-500">Ranked by total transaction events</p>
              </div>
              <button
                onClick={() => setCurrentTab('admin-accounts')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View All &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Account Number</th>
                    <th className="py-2.5 px-3">Holder</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3 text-center">Txns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {top_accounts?.map((acc) => (
                    <tr key={acc.account_number} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        {acc.account_number}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{acc.holder}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {acc.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          {acc.transaction_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
