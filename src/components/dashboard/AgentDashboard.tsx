import { useState, useEffect } from 'react';
import { User, Transaction } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet, Users, ArrowUpRight, ArrowDownRight, Activity,
  Copy, TrendingUp, Star, Zap, ChevronRight, RefreshCw,
  Gift, Target, DollarSign, BarChart2, Clock, CheckCircle2,
  Share2, Award, Phone, Search, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AgentDashboardProps {
  user: User;
  setView?: (view: any) => void;
}

type Tab = 'overview' | 'transactions' | 'referrals';

export default function AgentDashboard({ user, setView }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [agentStats, setAgentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, statsRes, refRes] = await Promise.all([
        fetch(`/api/transactions/${user.id}`, { credentials: 'include' }),
        fetch(`/api/agent/stats/${user.id}`, { credentials: 'include' }),
        fetch(`/api/agent/referrals/${user.id}`, { credentials: 'include' }),
      ]);
      const [txData, statsData, refData] = await Promise.all([txRes.json(), statsRes.json(), refRes.json()]);
      if (txData.success) setTransactions(txData.transactions || []);
      if (statsData.success) setAgentStats(statsData.stats);
      if (refData.success) setReferrals(refData.referrals || []);
    } catch {
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user.referralCode || '').then(() => toast.success('Referral code copied!'));
  };

  const shareReferralLink = () => {
    const link = `${window.location.origin}/?ref=${user.referralCode}`;
    if (navigator.share) {
      navigator.share({ title: 'Join Kosi Bills', text: `Use my referral code ${user.referralCode} to sign up on Kosi Bills!`, url: link });
    } else {
      navigator.clipboard.writeText(link).then(() => toast.success('Referral link copied!'));
    }
  };

  const totalCommission = transactions
    .filter(t => t.type === 'Commission' && t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthCommission = transactions
    .filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      return t.type === 'Commission' && t.status === 'success' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const successRate = transactions.length > 0
    ? Math.round((transactions.filter(t => t.status === 'success').length / transactions.length) * 100)
    : 0;

  const filteredTx = transactions.filter(t => {
    const matchFilter = txFilter === 'all' || t.status === txFilter;
    const matchSearch = !txSearch || t.type?.toLowerCase().includes(txSearch.toLowerCase()) || t.description?.toLowerCase().includes(txSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'referrals', label: 'Referrals', icon: Users },
  ];

  const tierBenefits = [
    { label: '2% Bill Discount', achieved: true },
    { label: 'Priority Support', achieved: true },
    { label: 'Referral Bonus', achieved: true },
    { label: 'Custom Pricing', achieved: (user.totalReferred || 0) >= 10 },
    { label: 'Dedicated Manager', achieved: (user.totalReferred || 0) >= 25 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817]">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white px-4 sm:px-6 pt-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-emerald-200 text-sm font-medium">Agent Portal</p>
              <h1 className="text-2xl font-black">{user.name.split(' ')[0]}'s Dashboard</h1>
            </div>
            <button onClick={fetchData} disabled={loading} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-4">
            <p className="text-emerald-200 text-sm mb-1">Agent Wallet Balance</p>
            <p className="text-4xl font-black mb-1">₦{user.balance.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 bg-white/10 rounded-xl p-3">
                <p className="text-emerald-200 text-xs">This Month</p>
                <p className="text-white font-bold text-lg">₦{thisMonthCommission.toLocaleString()}</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3">
                <p className="text-emerald-200 text-xs">Total Earned</p>
                <p className="text-white font-bold text-lg">₦{totalCommission.toLocaleString()}</p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3">
                <p className="text-emerald-200 text-xs">Success Rate</p>
                <p className="text-white font-bold text-lg">{successRate}%</p>
              </div>
            </div>
          </div>

          {/* Referral Code Card */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-emerald-200 text-xs mb-1">Your Referral Code</p>
              <p className="text-white font-black text-xl tracking-wider">{user.referralCode || 'N/A'}</p>
              <p className="text-emerald-200 text-xs mt-0.5">{user.totalReferred || 0} people referred</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={copyReferralCode} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={shareReferralLink} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-14 pb-8">

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg p-1.5 flex gap-1 mb-5">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Transactions', value: transactions.length, icon: Activity, color: 'blue' },
                  { label: 'Successful', value: transactions.filter(t => t.status === 'success').length, icon: CheckCircle2, color: 'emerald' },
                  { label: 'Referrals', value: user.totalReferred || 0, icon: Users, color: 'purple' },
                  { label: 'Avg. Commission', value: `₦${totalCommission > 0 ? Math.round(totalCommission / Math.max(transactions.filter(t => t.type === 'Commission').length, 1)).toLocaleString() : 0}`, icon: DollarSign, color: 'amber' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                      stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                      stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                      stat.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                      'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Agent Benefits */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Agent Benefits</h3>
                </div>
                <div className="space-y-3">
                  {tierBenefits.map(b => (
                    <div key={b.label} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        b.achieved ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-sm ${b.achieved ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}`}>{b.label}</span>
                      {!b.achieved && <span className="text-xs text-slate-400 ml-auto">Locked</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-purple-200" />
                  <h3 className="font-bold">Referral Progress</h3>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-purple-200 text-sm">Referred</p>
                    <p className="text-3xl font-black">{user.totalReferred || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-200 text-sm">Next milestone</p>
                    <p className="text-xl font-bold">
                      {(user.totalReferred || 0) < 10 ? 10 : (user.totalReferred || 0) < 25 ? 25 : 50}
                    </p>
                  </div>
                </div>
                <div className="bg-white/20 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-white rounded-full h-2.5 transition-all"
                    style={{
                      width: `${Math.min(100, ((user.totalReferred || 0) / ((user.totalReferred || 0) < 10 ? 10 : (user.totalReferred || 0) < 25 ? 25 : 50)) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-purple-200 text-xs">
                  {(user.totalReferred || 0) < 10
                    ? `${10 - (user.totalReferred || 0)} more to unlock Custom Pricing`
                    : (user.totalReferred || 0) < 25
                    ? `${25 - (user.totalReferred || 0)} more to unlock Dedicated Manager`
                    : 'All milestones unlocked! 🎉'}
                </p>
              </div>

              {/* Recent Transactions Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : transactions.slice(0, 5).length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No transactions yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.slice(0, 5).map(tx => (
                      <TxRow key={tx.id} tx={tx} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={txSearch}
                    onChange={e => setTxSearch(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(['all', 'success', 'pending', 'failed'] as const).map(f => (
                    <button key={f} onClick={() => setTxFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize flex-shrink-0 transition-colors ${
                        txFilter === f
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>{f}</button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredTx.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Activity className="w-10 h-10 mx-auto mb-3" />
                  <p className="font-medium">No transactions found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTx.map(tx => <TxRow key={tx.id} tx={tx} showDate />)}
                </div>
              )}
            </motion.div>
          )}

          {/* REFERRALS */}
          {activeTab === 'referrals' && (
            <motion.div key="referrals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Share Card */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white">
                <Gift className="w-7 h-7 text-emerald-200 mb-3" />
                <h3 className="font-black text-lg mb-1">Invite Friends, Earn More!</h3>
                <p className="text-emerald-200 text-sm mb-4">Share your referral code and earn bonuses for every signup that transacts.</p>
                <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between mb-3">
                  <div>
                    <p className="text-emerald-200 text-xs">Your Code</p>
                    <p className="font-black text-xl tracking-widest">{user.referralCode || 'N/A'}</p>
                  </div>
                  <button onClick={copyReferralCode} className="bg-white/20 hover:bg-white/30 p-2.5 rounded-xl transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={shareReferralLink} className="w-full bg-white text-emerald-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors">
                  <Share2 className="w-4 h-4" />
                  Share Referral Link
                </button>
              </div>

              {/* Referral List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Referred Users ({referrals.length})
                  </h3>
                </div>
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-medium text-slate-900 dark:text-white mb-1">No referrals yet</p>
                    <p className="text-sm">Share your code to start earning</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {referrals.map((ref, i) => (
                      <div key={ref.id || i} className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                          {ref.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{ref.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ref.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(ref.createdAt).toLocaleDateString()}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            ref.accountStatus === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>{ref.accountStatus || 'active'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

function TxRow({ tx, showDate = false }: { tx: Transaction; showDate?: boolean }) {
  const isCredit = tx.amount > 0;
  return (
    <div className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isCredit
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
      }`}>
        {isCredit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{tx.type}</p>
        {showDate && <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(tx.date).toLocaleString()}</p>}
        {!showDate && tx.description && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{tx.description}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-bold text-sm ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
          {isCredit ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
        </p>
        <p className={`text-xs capitalize ${
          tx.status === 'success' ? 'text-emerald-500' :
          tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'
        }`}>{tx.status}</p>
      </div>
    </div>
  );
}
