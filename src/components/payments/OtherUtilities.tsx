import { apiFetch } from '../../utils/api';
import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Droplets, Trash2, Car, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import PinModal from '../common/PinModal';
import Receipt from '../common/Receipt';
import { User, View, Receipt as ReceiptType } from '../../types';

interface OtherUtilitiesProps {
  user: User;
  setUser: (user: User) => void;
  setView: (view: View) => void;
  initialType?: 'water' | 'waste' | 'toll';
  retryData?: any;
  clearRetryData?: () => void;
}

export default function OtherUtilities({ user, setUser, setView, initialType, retryData, clearRetryData }: OtherUtilitiesProps) {
  const [utilityType, setUtilityType] = useState(initialType || '');
  const [provider, setProvider] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);

  const utilities = [
    { id: 'water', name: 'Water Bill', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', providers: [
      { id: 'lswc', name: 'Lagos Water (LSWC)' },
      { id: 'fctwater', name: 'FCT Water Board' },
      { id: 'ogswc', name: 'Ogun Water (OGSWC)' },
    ]},
    { id: 'waste', name: 'Waste Management', icon: Trash2, color: 'text-stone-500', bg: 'bg-stone-100 dark:bg-stone-900/30', providers: [
      { id: 'lawma', name: 'LAWMA (Lagos)' },
      { id: 'aepb', name: 'AEPB (Abuja)' },
    ]},
    { id: 'toll', name: 'Toll Pass', icon: Car, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', providers: [
      { id: 'lcc', name: 'LCC (Lekki Toll)' },
      { id: 'ikoyi', name: 'Ikoyi Link Bridge' },
    ]},
  ];

  const selectedUtility = utilities.find(u => u.id === utilityType);
  const selectedProvider = selectedUtility?.providers.find(p => p.id === provider);

  const handleInitiatePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!utilityType || !provider || !accountId || !amount || isLoading) return;
    
    if (Number(amount) < 100) {
      toast.error('Minimum payment is ₦100');
      return;
    }

    if (user.balance < Number(amount)) {
      toast.error('Insufficient balance');
      return;
    }

    setShowPinModal(true);
  };

  const handlePaymentSuccess = async (pin?: string) => {
    setShowPinModal(false);
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          pin,
          type: selectedUtility?.name || 'Utility',
          amount: Number(amount),
          description: `${selectedProvider?.name} - ${accountId}`,
          category: 'Utilities'
        })
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        const newReceipt: ReceiptType = {
          transactionId: data.transactionId,
          date: new Date().toLocaleString(),
          amount: data.finalAmount,
          type: `${selectedUtility?.name} Payment`,
          recipient: accountId,
          status: 'Success',
          reference: `REF-${Date.now()}`,
          fee: 0,
          total: data.finalAmount
        };
        setReceipt(newReceipt);
        setIsSuccess(true);
        toast.success(`${selectedUtility?.name} payment successful!`);
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
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">Payment Successful!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">
            Your {selectedUtility?.name} has been paid successfully.
          </p>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setView('dashboard')}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setProvider('');
                setAccountId('');
                setAmount('');
                setReceipt(null);
              }}
              className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold active:scale-95 transition-all"
            >
              Make Another Payment
            </button>
          </div>
        </div>
        
        {receipt && <Receipt receipt={receipt} onClose={() => setReceipt(null)} />}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="premium-card p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center">
            {selectedUtility ? <selectedUtility.icon className="w-6 h-6" /> : <Droplets className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{selectedUtility?.name || 'Other Utilities'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pay for water, waste, and toll services</p>
          </div>
        </div>

        <form onSubmit={handleInitiatePayment} className="space-y-4">
          {!initialType && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Utility Type</label>
              <div className="grid grid-cols-3 gap-2">
                {utilities.map((u) => {
                  const Icon = u.icon;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setUtilityType(u.id);
                        setProvider('');
                      }}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        utilityType === u.id 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-emerald-200 dark:hover:border-emerald-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-bold text-[10px]">{u.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {utilityType && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-2"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-base dark:text-white"
                  required
                >
                  <option value="" disabled>Choose provider</option>
                  {selectedUtility?.providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Account / ID</label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="Enter ID"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-base dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-lg dark:text-white"
                  required
                />
              </div>

              {user.isAgent && amount && Number(amount) >= 100 && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Agent Rate: ₦{(Number(amount) * 0.98).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !accountId || !amount || !provider}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-lg shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₦${(user.isAgent ? (Number(amount) * 0.98) : Number(amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                )}
              </button>
            </motion.div>
          )}
        </form>
      </div>

      <AnimatePresence>
        {showPinModal && (
          <PinModal
            onCancel={() => setShowPinModal(false)}
            onSuccess={handlePaymentSuccess}
            isBiometricEnabled={user.isBiometricEnabled}
            actionLabel={`${selectedUtility?.name} Payment`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
