import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { View, User, Transaction } from '../../types';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  PhoneCall, 
  Wifi, 
  Lightbulb, 
  Tv,
  ChevronRight,
  Clock,
  Loader2,
  Zap,
  ShieldCheck,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  UserPlus,
  X,
  CreditCard,
  Building2,
  Banknote,
  Lock,
  CheckCircle2
} from 'lucide-react';
import DashboardWalletCard from './DashboardWalletCard';
import DashboardQuickActions from './DashboardQuickActions';
import DashboardInsightsWidget from './DashboardInsightsWidget';
import DashboardRecentTransactions from './DashboardRecentTransactions';
import { getCurrentSeason, getSeasonStyles } from '../../utils/seasons';
import { storage } from '../../utils/storage';

interface DashboardProps {
  setView: (view: View) => void;
  user: User;
  setUser: (user: User) => void;
}

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

export default function Dashboard({ setView, user, setUser }: DashboardProps) {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [subWallets, setSubWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFunding, setIsFunding] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('1000');
  const [hideBalance, setHideBalance] = useState(user.hideBalance || false);
  const [showPinModal, setShowPinModal] = useState(user.hasPin === false);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [isSettingPin, setIsSettingPin] = useState(false);

  const fetchRecent = async () => {
    try {
      const response = await fetch(`/api/transactions/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setRecentTransactions((data.transactions || []).slice(0, 5));
      }
      
      const swResponse = await fetch(`/api/sub-wallets/${user.id}`);
      const swData = await swResponse.json();
      if (swData.success) {
        setSubWallets([...(swData.owned || []), ...(swData.shared || [])].slice(0, 2));
      }
    } catch (error) {
      console.error("Failed to fetch recent transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchRecent();
    }
    setHideBalance(user.hideBalance || false);
  }, [user?.id, user.hideBalance]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const userResponse = await fetch(`/api/user/${user.id}`);
      const userData = await userResponse.json();
      if (userData.success) {
        setUser(userData.user);
        storage.set('kosi_user', JSON.stringify(userData.user));
      } else {
        throw new Error(userData.error || 'Failed to fetch user');
      }
      await fetchRecent();
      toast.success("Dashboard refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
      setIsLoading(false);
    }
  };

  const handleFundWallet = async () => {
    const amount = fundAmount;
    if (!amount || isNaN(Number(amount)) || Number(amount) < 100) {
      toast.error('Minimum funding amount is ₦100');
      return;
    }
    
    setShowFundModal(false);

    const tx_ref = `KOSI-${Date.now()}`;
    const publicKey = import.meta.env.VITE_FLW_PUBLIC_KEY;

    if (!publicKey) {
      toast.error("Payment gateway not configured. Please contact support.");
      return;
    }

    window.FlutterwaveCheckout({
      public_key: publicKey,
      tx_ref: tx_ref,
      amount: Number(amount),
      currency: "NGN",
      payment_options: "card, banktransfer, ussd",
      customer: {
        email: user.email,
        name: user.name,
      },
      customizations: {
        title: "Kosi Bills",
        description: "Wallet Funding",
        logo: "https://picsum.photos/seed/kosi/200/200",
      },
      callback: async (data: any) => {
        setIsFunding(true);
        try {
          const response = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transaction_id: data.transaction_id,
              tx_ref: tx_ref,
              userId: user.id
            })
          });
          const result = await response.json();
          if (result.success) {
            setUser(result.user);
            storage.set('kosi_user', JSON.stringify(result.user));
            toast.success("Wallet funded successfully!");
            const txResponse = await fetch(`/api/transactions/${user.id}`);
            const txData = await txResponse.json();
            if (txData.success) setRecentTransactions((txData.transactions || []).slice(0, 5));
          } else {
            toast.error("Payment verification failed: " + result.error);
          }
        } catch (err) {
          toast.error("Error verifying payment");
        } finally {
          setIsFunding(false);
        }
      },
      onclose: () => {}
    });
  };

  const budgetLimit = 50000;

  const { thisMonthSpent, lastMonthSpent, topExpenseCategory, budgetUsedPercent, aiTip, upcomingBillNudge } = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthTxs = recentTransactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonthTxs = recentTransactions.filter(tx => {
      const d = new Date(tx.date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const thisMonthSpentCalc = thisMonthTxs.filter(tx => tx.amount < 0).reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const lastMonthSpentCalc = lastMonthTxs.filter(tx => tx.amount < 0).reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    
    const expensesByCategory = thisMonthTxs.filter(tx => tx.amount < 0).reduce((acc, tx) => {
      const cat = tx.category || 'Other';
      acc[cat] = (acc[cat] || 0) + Math.abs(tx.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(expensesByCategory).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'None';
    
    const budgetPercent = Math.min(100, Math.round((thisMonthSpentCalc / budgetLimit) * 100));
    
    let tip = "You're doing great! Keep tracking your expenses.";
    if (thisMonthSpentCalc > lastMonthSpentCalc && lastMonthSpentCalc > 0) {
      const percentIncrease = Math.round(((thisMonthSpentCalc - lastMonthSpentCalc) / lastMonthSpentCalc) * 100);
      tip = `You spent ${percentIncrease}% more this month compared to last month. Consider reviewing your ${topCategory} expenses.`;
    } else if (thisMonthSpentCalc < lastMonthSpentCalc) {
      tip = `Great job! You spent less this month compared to last month.`;
    }

    let nudge = null;
    const utilityTxs = recentTransactions.filter(tx => tx.category === 'Utilities' || tx.category === 'Entertainment');
    if (utilityTxs.length > 0) {
      const lastUtility = utilityTxs[0];
      const amount = Math.abs(lastUtility.amount);
      const type = lastUtility.type || 'Utility';
      nudge = {
        message: `Your ₦${amount.toLocaleString()} ${type} bill is usually due in 3 days. Shall I set aside the funds?`,
        amount: amount,
        type: type
      };
    }

    return {
      thisMonthSpent: thisMonthSpentCalc,
      lastMonthSpent: lastMonthSpentCalc,
      topExpenseCategory: topCategory,
      budgetUsedPercent: budgetPercent,
      aiTip: tip,
      upcomingBillNudge: nudge
    };
  }, [recentTransactions]);

  const toggleBalanceVisibility = async () => {
    const newValue = !hideBalance;
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, hideBalance: newValue })
      });
      const data = await response.json();
      if (data.success) {
        setHideBalance(newValue);
        setUser(data.user);
        storage.set('kosi_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to toggle balance visibility', err);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinStep === 'enter') {
      if (pinValue.length !== 4) {
        toast.error('PIN must be exactly 4 digits');
        return;
      }
      setPinStep('confirm');
      return;
    }

    if (pinValue !== pinConfirm) {
      toast.error('PINs do not match. Please try again.');
      setPinConfirm('');
      setPinStep('enter');
      setPinValue('');
      return;
    }

    setIsSettingPin(true);
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pin: pinValue })
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        storage.set('kosi_user', JSON.stringify(data.user));
        setShowPinModal(false);
        toast.success('Transaction PIN set successfully!');
      } else {
        toast.error(data.error || 'Failed to set PIN');
      }
    } catch (err) {
      toast.error('Failed to set PIN. Please try again.');
    } finally {
      setIsSettingPin(false);
    }
  };

  const season = getCurrentSeason();
  const seasonStyles = getSeasonStyles(season);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Greeting bar */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{seasonStyles.icon} {seasonStyles.greeting}</p>
          <h2 className="font-black text-slate-800 dark:text-white text-lg leading-tight">{user.name.split(' ')[0]} 👋</h2>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(user.referralCode || 'KOSI-REF');
            toast.success('Referral code copied!');
          }}
          className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Refer & Earn
        </button>
      </motion.div>

      {/* Wallet Card */}
      <DashboardWalletCard 
        user={user}
        hideBalance={hideBalance}
        toggleBalanceVisibility={toggleBalanceVisibility}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
        setShowBankDetails={setShowBankDetails}
        showBankDetails={showBankDetails}
        setShowFundModal={setShowFundModal}
        isFunding={isFunding}
        setView={setView}
      />

      {/* Services grid */}
      <DashboardQuickActions 
        setView={setView}
        userPhone={user.phone}
      />

      {/* Recent Transactions */}
      <DashboardRecentTransactions 
        transactions={recentTransactions}
        isLoading={isLoading}
        setView={setView}
      />

      {/* AI Insights & Sub-Wallets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DashboardInsightsWidget 
          aiTip={aiTip}
          topExpenseCategory={topExpenseCategory}
          budgetUsedPercent={budgetUsedPercent}
          budgetLimit={budgetLimit}
        />
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Family & Office Wallets</h2>
            <button onClick={() => setView('sub-wallets')} className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">Manage</button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {subWallets.length > 0 ? subWallets.map((wallet) => (
              <div key={wallet.id} className="bg-white/60 dark:bg-slate-900/60 border border-white/50 dark:border-slate-700/50 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/80 dark:hover:bg-slate-900/80 transition-colors" onClick={() => setView('sub-wallets')}>
                <p className="font-bold text-xs text-slate-800 dark:text-white">{wallet.name}</p>
                <p className="font-black text-xs text-emerald-600 dark:text-emerald-400">₦{wallet.balance.toLocaleString()}</p>
              </div>
            )) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">No sub-wallets yet.</p>
                <button onClick={() => setView('sub-wallets')} className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 hover:underline">Create one</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fund Wallet Modal */}
      <AnimatePresence>
        {showFundModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowFundModal(false); }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 60, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Fund Wallet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose an amount or enter custom</p>
                </div>
                <button onClick={() => setShowFundModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESET_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setFundAmount(String(amount))}
                    className={`py-3 rounded-xl font-bold text-sm transition-all ${
                      fundAmount === String(amount) 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    ₦{amount.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">₦</span>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Enter amount"
                  min="100"
                />
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-3 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Pay via card, bank transfer, or USSD. Funds appear instantly.</p>
              </div>

              <button
                onClick={handleFundWallet}
                disabled={!fundAmount || Number(fundAmount) < 100}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Fund ₦{Number(fundAmount || 0).toLocaleString()}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bank Transfer Details Modal */}
      <AnimatePresence>
        {showBankDetails && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowBankDetails(false); }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 60 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Bank Transfer</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Transfer to this account to fund your wallet</p>
                </div>
                <button onClick={() => setShowBankDetails(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white mb-4">
                <div className="flex items-center gap-2 mb-4 opacity-80">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Kosi Bills Virtual Account</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs opacity-70 mb-1">Bank Name</p>
                    <p className="font-bold">Wema Bank</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70 mb-1">Account Number</p>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-2xl tracking-wider">0123456789</p>
                      <button 
                        onClick={() => { navigator.clipboard.writeText('0123456789'); toast.success('Account number copied!'); }}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs opacity-70 mb-1">Account Name</p>
                    <p className="font-bold">{user.name} / Kosi Bills</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Transfers are processed automatically within minutes</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>No transfer fee charged by Kosi Bills</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>This account number is unique to you. Do not share with others.</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white text-center">
                  {pinStep === 'enter' ? 'Create Transaction PIN' : 'Confirm Your PIN'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                  {pinStep === 'enter' ? 'Enter a 4-digit PIN to secure your transactions' : 'Re-enter your PIN to confirm'}
                </p>
              </div>

              <form onSubmit={handleSetPin} className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinStep === 'enter' ? pinValue : pinConfirm}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (pinStep === 'enter') setPinValue(val);
                      else setPinConfirm(val);
                    }}
                    className="w-full text-center text-3xl tracking-[1em] py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="••••"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  {pinStep === 'confirm' && (
                    <button
                      type="button"
                      onClick={() => { setPinStep('enter'); setPinConfirm(''); }}
                      className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSettingPin || (pinStep === 'enter' ? pinValue.length !== 4 : pinConfirm.length !== 4)}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSettingPin ? <Loader2 className="w-5 h-5 animate-spin" /> : pinStep === 'enter' ? 'Continue' : 'Set PIN'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-2"
                >
                  Skip for now
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
