import { apiFetch } from '../../utils/api';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gift, Award, Star, Users, Share2, Copy, Loader2, ChevronRight, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import toast from 'react-hot-toast';

interface RewardsProps {
  user: User;
}

interface Reward {
  id: number;
  title: string;
  points: number;
  icon: string;
  color: string;
  bg: string;
}

const TIERS = [
  { name: 'Basic',   points: 0,      color: 'bg-slate-400',   label: 'Starter' },
  { name: 'Silver',  points: 5000,   color: 'bg-slate-400',   label: '5,000 pts' },
  { name: 'Gold',    points: 20000,  color: 'bg-amber-400',   label: '20,000 pts' },
  { name: 'Premium', points: 50000,  color: 'bg-emerald-500', label: '50,000 pts' },
];

const USER_POINTS = 12450;

function TierProgress({ userPoints }: { userPoints: number }) {
  const currentIdx = TIERS.reduce((idx, t, i) => userPoints >= t.points ? i : idx, 0);
  const current = TIERS[currentIdx];
  const next = TIERS[currentIdx + 1];
  const progress = next ? Math.min(((userPoints - current.points) / (next.points - current.points)) * 100, 100) : 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {TIERS.map((tier, i) => (
          <div key={tier.name} className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
              i <= currentIdx ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600 bg-transparent'
            }`}>
              {i <= currentIdx ? <ShieldCheck className="w-4 h-4 text-white" /> : <span className="text-[10px] font-black text-slate-400">{i + 1}</span>}
            </div>
            <span className={`text-[10px] font-bold ${i <= currentIdx ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{tier.name}</span>
          </div>
        ))}
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
      </div>
      {next && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          <span className="font-bold text-slate-700 dark:text-slate-300">{(next.points - userPoints).toLocaleString()} points</span> more to reach {next.name}
        </p>
      )}
    </div>
  );
}

export default function Rewards({ user }: RewardsProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const referralCode = user.referralCode || `KOSI-${(user.name || 'USR').substring(0, 3).toUpperCase()}`;

  useEffect(() => {
    fetch('/api/rewards').then(r => r.json()).then(d => { if (d.success) setRewards(d.rewards); }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const handleCopyCode = () => { navigator.clipboard.writeText(referralCode); toast.success('Referral code copied!'); };
  const handleShareWhatsApp = () => {
    const text = `Join me on Kosi Bills! Use my referral code ${referralCode} and we both get ₦100 airtime after your first ₦2,000+ transaction. https://kosibills.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  const handleApplyAgent = async () => {
    try {
      const r = await apiFetch('/api/user/apply-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
      const d = await r.json();
      if (d.success) toast.success('Application submitted! We will contact you soon.');
      else toast.error(d.error || 'Failed to submit application');
    } catch { toast.error('Network error'); }
  };

  const stats = [
    { label: 'Points', value: USER_POINTS.toLocaleString(), icon: Award, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Friends Invited', value: (user.totalReferred || 0).toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Transactions', value: '47', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      {/* Points Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-bold text-white/60 text-sm">Kosi Rewards</span>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Total Points</p>
          <p className="text-5xl font-black tracking-tighter mb-2">{USER_POINTS.toLocaleString()}</p>
          <p className="text-white/50 text-xs">≈ ₦{(USER_POINTS * 0.5).toLocaleString()} cashback value</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 text-center shadow-sm">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="font-black text-slate-800 dark:text-white text-lg">{value}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tier Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 dark:text-white">Tier Progress</h3>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">{user.tier || 'Basic'}</span>
        </div>
        <TierProgress userPoints={USER_POINTS} />
      </div>

      {/* Refer & Earn */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-white">Refer & Earn</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">₦100 airtime per successful referral</p>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 mb-4">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
            Share your code. When a friend makes their first ₦2,000+ transaction, you both get ₦100 airtime instantly! 🎉
          </p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono font-black text-lg text-slate-800 dark:text-white tracking-widest text-center">
            {referralCode}
          </div>
          <button onClick={handleCopyCode}
            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-90">
            <Copy className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <button onClick={handleShareWhatsApp}
          className="w-full py-3 bg-[#25D366] hover:bg-[#20b95a] text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-95">
          <Share2 className="w-4 h-4" /> Share via WhatsApp
        </button>
      </div>

      {/* Agent Program */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[1.5rem] p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-white">Kosi Agent Program</h3>
            <p className="text-xs text-indigo-200">For hostel & market leaders</p>
          </div>
        </div>
        <div className="relative z-10 space-y-2 mb-4">
          {['Discounted wholesale rates on Airtime & Data', 'Dedicated agent support line', 'Monthly performance bonuses'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-indigo-100">
              <Zap className="w-4 h-4 text-amber-300 shrink-0 fill-current" />
              {item}
            </div>
          ))}
        </div>
        {user.isAgent ? (
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center relative z-10">
            <p className="font-bold text-white text-sm">✓ You are an active Kosi Agent</p>
          </div>
        ) : (
          <button onClick={handleApplyAgent}
            className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black transition-all hover:bg-indigo-50 active:scale-95 relative z-10 shadow-lg">
            Apply to Become an Agent
          </button>
        )}
      </div>

      {/* Redeem Points */}
      <div>
        <h3 className="font-black text-slate-800 dark:text-white mb-3 px-1">Redeem Points</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isLoading ? (
            <div className="col-span-2 flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : rewards.length > 0 ? rewards.map((offer, i) => {
            const IconMap: any = { Star, Gift, Award };
            const Icon = IconMap[offer.icon] || Star;
            return (
              <motion.button key={offer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-95 text-left group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${offer.bg} ${offer.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{offer.title}</h4>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{offer.points.toLocaleString()} pts</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </motion.button>
            );
          }) : (
            <div className="col-span-2 text-center py-8 text-slate-400">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">No rewards available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
