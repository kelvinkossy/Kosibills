import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Gamepad2, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import PinModal from '../common/PinModal';
import Receipt from '../common/Receipt';
import { User, View, Receipt as ReceiptType } from '../../types';

interface BettingProps {
  user: User;
  setUser: (user: User) => void;
  setView: (view: View) => void;
  retryData?: any;
  clearRetryData?: () => void;
}

export default function Betting({ user, setUser, setView, retryData, clearRetryData }: BettingProps) {
  const [provider, setProvider] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);

  const providers = [
    { id: 'msport', name: 'MSport' },
    { id: 'bet9ja', name: 'Bet9ja' },
    { id: '1xbet', name: '1xBet' },
    { id: 'sportybet', name: 'SportyBet' },
    { id: 'betking', name: 'BetKing' },
    { id: 'nairabet', name: 'NairaBET' },
  ];

  const handleInitiatePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!provider || !customerId || !amount || isLoading) return;

    const numAmount = Number(amount);
    if (numAmount < 100) {
      toast.error('Minimum amount is ₦100');
      return;
    }
    
    if (customerId.length < 4) {
      toast.error('Please enter a valid Customer ID');
      return;
    }

    if (user.balance < numAmount) {
      toast.error('Insufficient balance');
      return;
    }

    setShowPinModal(true);
  };

  const handlePaymentSuccess = async (pin?: string) => {
    setShowPinModal(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          pin,
          type: 'Betting',
          amount: Number(amount),
          description: `Funded ${providers.find(p => p.id === provider)?.name} account (${customerId})`,
          category: 'Entertainment'
        })
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        const newReceipt: ReceiptType = {
          transactionId: data.transactionId,
          date: new Date().toLocaleString(),
          amount: data.finalAmount,
          type: 'Betting Wallet Funding',
          recipient: customerId,
          status: 'Success',
          reference: `REF-${Date.now()}`,
          fee: 0,
          total: data.finalAmount
        };
        setReceipt(newReceipt);
        setIsSuccess(true);
        toast.success('Betting account funded successfully!');
      } else {
        toast.error(data.error || 'Payment failed');
      }
    } catch (error) {
      toast.error('An error occurred during payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && receipt) {
    return (
      <div className="space-y-6">
        <div className="premium-card p-8 sm:p-12 max-w-md mx-auto text-center mt-8">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">Funding Successful!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">
            Your betting wallet has been credited.
          </p>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setView('dashboard')}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-xl shadow-red-600/20 active:scale-95 transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setProvider('');
                setCustomerId('');
                setAmount('');
                setReceipt(null);
              }}
              className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold active:scale-95 transition-all"
            >
              Fund Another Wallet
            </button>
          </div>
        </div>
        
        {receipt && <Receipt receipt={receipt} onClose={() => setReceipt(null)} />}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-4">
      <div className="premium-card p-6 sm:p-8 bg-gradient-to-br from-red-600 to-rose-700 text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-400/20 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-xl">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter">Betting & Lottery</h2>
            <p className="text-red-100 font-medium text-sm mt-0.5">Fund your betting wallets instantly</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleInitiatePayment} className="premium-card p-4 sm:p-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Provider</label>
          <div className="grid grid-cols-3 gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  provider === p.id 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="font-bold text-xs">{p.name}</span>
                {provider === p.id && <CheckCircle2 className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>

        {provider && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-2"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Customer ID / User ID</label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Enter your betting ID"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-sm dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-black text-xl dark:text-white"
                required
              />
              <div className="flex gap-2 mt-2">
                {['500', '1000', '2000', '5000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    ₦{preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                Verify Customer ID. Payments cannot be reversed.
              </p>
            </div>

            {user.isAgent && amount && Number(amount) >= 500 && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 className="w-3 h-3" />
                Agent Rate: 2% discount
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !customerId || !amount}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? 'Processing...' : `Pay ₦${amount ? (user.isAgent ? (Number(amount) * 0.98) : Number(amount)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0'}`}
              {!isLoading && <ChevronRight className="w-4 h-4" />}
            </button>
          </motion.div>
        )}
      </form>

      <AnimatePresence>
        {showPinModal && (
          <PinModal
            onCancel={() => setShowPinModal(false)}
            onSuccess={handlePaymentSuccess}
            isBiometricEnabled={user.isBiometricEnabled}
            actionLabel="Betting Wallet Funding"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
