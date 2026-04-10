import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, RefreshCw, Copy, ArrowUpRight, ArrowDownLeft, Send, Plus } from 'lucide-react';
import { User } from '../../types';
import { toast } from 'react-hot-toast';

interface WalletCardProps {
  user: User;
  hideBalance: boolean;
  toggleBalanceVisibility: () => void;
  handleRefresh: () => void;
  isLoading: boolean;
  setShowBankDetails: (show: boolean) => void;
  showBankDetails: boolean;
  setShowFundModal: (show: boolean) => void;
  isFunding: boolean;
  setView?: (view: any) => void;
}

const TIER_COLORS: Record<string, { from: string; to: string; badge: string }> = {
  Basic:   { from: '#1e293b', to: '#0f172a',   badge: 'bg-slate-700/60 text-slate-300' },
  Silver:  { from: '#334155', to: '#1e293b',   badge: 'bg-slate-600/60 text-slate-200' },
  Gold:    { from: '#78350f', to: '#451a03',   badge: 'bg-amber-900/60 text-amber-300' },
  Premium: { from: '#064e3b', to: '#022c22',   badge: 'bg-emerald-900/60 text-emerald-300' },
};

export default function WalletCard({
  user, hideBalance, toggleBalanceVisibility, handleRefresh,
  isLoading, setShowBankDetails, setShowFundModal, isFunding, setView
}: WalletCardProps) {
  const tier = user.tier || 'Basic';
  const colors = TIER_COLORS[tier] || TIER_COLORS.Basic;
  const balance = Number(user.balance || 0);
  const formattedBalance = balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const copyAccountNumber = () => {
    navigator.clipboard.writeText('0123456789');
    toast.success('Account number copied!');
  };

  const quickBtns = [
    { label: 'Add Money',   icon: Plus,          action: () => setShowFundModal(true),                  color: 'bg-emerald-500' },
    { label: 'Send',        icon: Send,          action: () => setView?.('transfer'),                   color: 'bg-blue-500' },
    { label: 'Bank In',     icon: ArrowDownLeft, action: () => setShowBankDetails(true),               color: 'bg-violet-500' },
    { label: 'History',     icon: ArrowUpRight,  action: () => setView?.('history'),                   color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-3">
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)` }}
        className="relative rounded-[2rem] p-6 overflow-hidden shadow-2xl shadow-slate-900/40"
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-8 right-8 w-24 h-24 rounded-full bg-white/3 pointer-events-none" />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${colors.badge}`}>
                {tier} Account
              </span>
              {user.isLiveMode && (
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-500/20 text-red-400">
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleBalanceVisibility}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-90">
                {hideBalance ? <EyeOff className="w-4 h-4 text-white/70" /> : <Eye className="w-4 h-4 text-white/70" />}
              </button>
              <button onClick={handleRefresh} disabled={isLoading}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-90 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 text-white/70 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="mb-6">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Available Balance</p>
            <motion.div
              key={hideBalance ? 'hidden' : formattedBalance}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-baseline gap-2">
              <span className="text-white/60 text-2xl font-black">₦</span>
              <span className="text-white text-4xl sm:text-5xl font-black tracking-tight">
                {hideBalance ? '••••••' : formattedBalance}
              </span>
            </motion.div>
          </div>

          {/* Account info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Account holder</p>
              <p className="text-white font-bold text-sm mt-0.5 truncate max-w-[180px]">{user.name}</p>
            </div>
            <button onClick={copyAccountNumber}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-all active:scale-95">
              <span className="text-white font-bold text-xs tracking-widest">0123 456 789</span>
              <Copy className="w-3 h-3 text-white/60" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-4 gap-2">
        {quickBtns.map(({ label, icon: Icon, action, color }, i) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={action}
            disabled={label === 'Add Money' && isFunding}
            className="flex flex-col items-center gap-2 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
