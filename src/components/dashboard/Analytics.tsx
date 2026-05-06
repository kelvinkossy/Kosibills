import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    todayRevenue: number;
    totalTransactions: number;
    todayTransactions: number;
  };
  revenueTrend: Array<{ date: string; revenue: number }>;
  userGrowth: Array<{ date: string; users: number }>;
  transactionBreakdown: Array<{ type: string; category: string; count: number; total: number }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, revenueRes, growthRes, breakdownRes] = await Promise.all([
        apiFetch('/api/analytics/overview', { credentials: 'include' }),
        apiFetch(`/api/analytics/revenue-trend?days=${days}`, { credentials: 'include' }),
        apiFetch(`/api/analytics/user-growth?days=${days}`, { credentials: 'include' }),
        apiFetch('/api/analytics/transaction-breakdown', { credentials: 'include' })
      ]);

      const overview = await overviewRes.json();
      const revenue = await revenueRes.json();
      const growth = await growthRes.json();
      const breakdown = await breakdownRes.json();

      if (overview.success && revenue.success && growth.success && breakdown.success) {
        setData({
          overview: overview.data,
          revenueTrend: revenue.data,
          userGrowth: growth.data,
          transactionBreakdown: breakdown.data
        });
      } else {
        toast.error('Failed to load analytics data');
      }
    } catch (error) {
      toast.error('Failed to load analytics data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const StatCard = ({ title, value, icon: Icon, change, prefix = '' }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {prefix}{value.toLocaleString()}
          </p>
          {change && (
            <p className={`text-xs mt-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    </div>
  );

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Total Users"
            value={data.overview.totalUsers}
            icon={Users}
            prefix=""
          />
          <StatCard
            title="Active Users"
            value={data.overview.activeUsers}
            icon={Activity}
            prefix=""
          />
          <StatCard
            title="Total Revenue"
            value={data.overview.totalRevenue}
            icon={DollarSign}
            prefix="₦"
          />
          <StatCard
            title="Today's Revenue"
            value={data.overview.todayRevenue}
            icon={TrendingUp}
            prefix="₦"
          />
          <StatCard
            title="Total Transactions"
            value={data.overview.totalTransactions}
            icon={Calendar}
            prefix=""
          />
          <StatCard
            title="Today's Transactions"
            value={data.overview.todayTransactions}
            icon={Activity}
            prefix=""
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* User Growth */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">User Growth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Transaction Breakdown</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.transactionBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
