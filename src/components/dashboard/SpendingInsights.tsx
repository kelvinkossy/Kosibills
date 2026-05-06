import { apiFetch } from '../../utils/api';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Zap,
  Tv,
  PhoneCall,
  Wifi,
  Lightbulb,
  Gamepad2,
  GraduationCap,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface SpendingData {
  category: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
}

interface SpendingInsightsProps {
  user: any;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Airtime': '#10b981',
  'Data': '#3b82f6',
  'Electricity': '#f59e0b',
  'Cable TV': '#ef4444',
  'Betting': '#8b5cf6',
  'Internet': '#ec4899',
  'Education': '#06b6d4',
  'Transfer': '#84cc16',
  'Other': '#64748b'
};

const CATEGORY_ICONS: Record<string, any> = {
  'Airtime': PhoneCall,
  'Data': Wifi,
  'Electricity': Lightbulb,
  'Cable TV': Tv,
  'Betting': Gamepad2,
  'Internet': Zap,
  'Education': GraduationCap,
  'Transfer': CreditCard,
  'Other': Wallet
};

export default function SpendingInsights({ user }: SpendingInsightsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/transactions/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      toast.error('Failed to load spending data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user.id]);

  const { spendingByCategory, monthlySpending, totalSpending, averageDaily } = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (timeRange === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filtered = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && tx.amount < 0 && tx.status === 'success';
    });

    const categoryMap = new Map<string, number>();
    filtered.forEach(tx => {
      const category = tx.category || tx.type || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + Math.abs(tx.amount));
    });

    const total = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
    const spendingByCategory: SpendingData[] = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      icon: category,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS['Other']
    })).sort((a, b) => b.amount - a.amount);

    // Monthly spending for chart
    const monthlyMap = new Map<string, number>();
    filtered.forEach(tx => {
      const month = new Date(tx.date).toLocaleString('default', { month: 'short' });
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + Math.abs(tx.amount));
    });

    const monthlySpending = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
      month,
      amount
    }));

    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const averageDaily = total / days;

    return { spendingByCategory, monthlySpending, totalSpending: total, averageDaily };
  }, [transactions, timeRange]);

  if (loading) {
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
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Spending Insights</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Track where your money goes</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={fetchTransactions}
              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Spent</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  ₦{totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Daily</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  ₦{averageDaily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Transactions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {transactions.filter(t => t.amount < 0).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Spending by Category */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Monthly Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Category Breakdown</h2>
          <div className="space-y-4">
            {spendingByCategory.map((item) => {
              const Icon = CATEGORY_ICONS[item.category] || Wallet;
              return (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                    <Icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-slate-900 dark:text-white">{item.category}</p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        ₦{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.percentage.toFixed(1)}% of total</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
