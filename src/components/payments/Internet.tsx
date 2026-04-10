import { apiFetch } from '../../utils/api';
import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Globe, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import PinModal from '../common/PinModal';
import Receipt from '../common/Receipt';
import { User, View, Receipt as ReceiptType } from '../../types';

interface InternetProps {
  user: User;
  setUser: (user: User) => void;
  setView: (view: View) => void;
  retryData?: any;
  clearRetryData?: () => void;
}

export default function Internet({ user, setUser, setView, retryData, clearRetryData }: InternetProps) {
  const [provider, setProvider] = useState('');
  const [accountId, setAccountId] = useState('');
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);

  const providers = [
    { id: 'spectranet', name: 'Spectranet' },
    { id: 'smile', name: 'Smile' },
    { id: 'swift', name: 'Swift' },
    { id: 'ipnx', name: 'ipNX' },
    { id: 'fiberone', name: 'FiberOne' },
  ];

  const plans = {
    spectranet: [
      { id: 's1', name: 'Unified Value 4GB', price: 1500 },
      { id: 's2', name: 'Unified Value 7GB', price: 2000 },
      { id: 's3', name: 'Mega Value 15GB', price: 4000 },
      { id: 's4', name: 'Always On 40GB', price: 10000 },
    ],
    smile: [
      { id: 'sm1', name: 'SmileVoice ONLY', price: 500 },
      { id: 'sm2', name: '1.5GB BigWater', price: 1000 },
      { id: 'sm3', name: '15GB Anytime', price: 5000 },
      { id: 'sm4', name: 'UnlimitedLite', price: 10000 },
    ],
    swift: [
      { id: 'sw1', name: 'SWIFT Essential 14GB', price: 4000 },
      { id: 'sw2', name: 'SWIFT Club 20GB', price: 5000 },
      { id: 'sw3', name: 'SWIFT Premium 40GB', price: 10000 },
    ],
    ipnx: [
      { id: 'ip1', name: 'FOS Xtreme 100', price: 15000 },
      { id: 'ip2', name: 'FOS Xtreme 200', price: 25000 },
    ],
    fiberone: [
      { id: 'f1', name: 'SmartHome 16Mbps', price: 11950 },
      { id: 'f2', name: 'SmartHome 30Mbps', price: 16950 },
    ]
  };

  const selectedPlanDetails = provider && plan ? plans[provider as keyof typeof plans].find(p => p.id === plan) : null;

  const handleInitiatePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!provider || !accountId || !plan || !selectedPlanDetails || isLoading) return;
    
    if (accountId.length < 6 || !/^\d+$/.test(accountId)) {
      toast.error('Please enter a valid account ID');
      return;
    }

    if (user.balance < selectedPlanDetails.price) {
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
          type: 'Internet',
          amount: selectedPlanDetails?.price,
          description: `${providers.find(p => p.id === provider)?.name} - ${selectedPlanDetails?.name} (${accountId})`,
          category: 'Telecommunications'
        })
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        const newReceipt: ReceiptType = {
          transactionId: data.transactionId,
          date: new Date().toLocaleString(),
          amount: data.finalAmount,
          type: 'Internet Subscription',
          recipient: accountId,
          status: 'Success',
          reference: `REF-${Date.now()}`,
          fee: 0,
          total: data.finalAmount
        };
        setReceipt(newReceipt);
        setIsSuccess(true);
        toast.success('Internet subscription successful!');
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
          <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">Subscription Successful!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">
            Your internet service has been renewed.
          </p>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setView('dashboard')}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setProvider('');
                setAccountId('');
                setPlan('');
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
          <div className="w-12 h-12 shrink-0 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Internet Service</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Renew broadband subscriptions</p>
          </div>
        </div>

        <form onSubmit={handleInitiatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Provider</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProvider(p.id);
                    setPlan('');
                  }}
                  className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                    provider === p.id 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' 
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="font-bold text-[10px]">{p.name}</span>
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Account / Device ID</label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="Enter ID"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-base dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Plan</label>
                <div className="relative">
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-base appearance-none dark:text-white"
                    required
                  >
                    <option value="" disabled>Choose a plan</option>
                    {plans[provider as keyof typeof plans].map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₦{p.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              {selectedPlanDetails && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Amount:</span>
                  <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">
                    ₦{(user.isAgent ? (selectedPlanDetails.price * 0.98) : selectedPlanDetails.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !accountId || !plan}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-lg shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₦${selectedPlanDetails ? (user.isAgent ? (selectedPlanDetails.price * 0.98) : selectedPlanDetails.price).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`
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
            actionLabel="Internet Subscription"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
