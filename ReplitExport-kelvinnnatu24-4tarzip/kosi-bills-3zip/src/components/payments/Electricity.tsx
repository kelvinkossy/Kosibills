import { useState, FormEvent, useEffect } from 'react';
import { Lightbulb, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import PinModal from '../common/PinModal';
import Receipt from '../common/Receipt';
import { View, User, Receipt as ReceiptType } from '../../types';

interface ElectricityProps {
  user: User;
  setUser: (user: User) => void;
  setView: (view: View) => void;
  retryData?: any;
  clearRetryData?: () => void;
}

export default function Electricity({ user, setUser, setView, retryData, clearRetryData }: ElectricityProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [provider, setProvider] = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);

  useEffect(() => {
    fetch('/api/bill-services/Electricity')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProviders(data.services.map((s: any) => ({
            id: s.provider_id,
            name: s.provider_name
          })));
        }
      })
      .catch(err => console.error('Failed to fetch electricity providers:', err));
  }, []);

  useEffect(() => {
    if (retryData && retryData.provider && retryData.meterNumber && retryData.amount) {
      setProvider(retryData.provider);
      setMeterNumber(retryData.meterNumber);
      setAmount(retryData.amount.toString());
      setMeterType(retryData.meterType || 'prepaid');
      if (clearRetryData) clearRetryData();
    }
  }, [retryData, clearRetryData]);

  const handleInitiatePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!provider || !meterNumber || !amount || isLoading) return;
    
    if (meterNumber.length < 10 || !/^\d+$/.test(meterNumber)) {
      toast.error('Please enter a valid meter number');
      return;
    }
    
    if (Number(amount) < 500) {
      toast.error('Minimum electricity payment is ₦500');
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
          type: 'Electricity',
          description: `${providers.find(p => p.id === provider)?.name} - ${meterType.toUpperCase()} - ${meterNumber}`,
          amount: Number(amount),
          metadata: { provider, meterType, meterNumber, amount: Number(amount) }
        })
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        const newReceipt: ReceiptType = {
          transactionId: data.transactionId,
          date: new Date().toLocaleString(),
          amount: data.finalAmount,
          type: 'Electricity Bill',
          recipient: meterNumber,
          status: 'Success',
          reference: `REF-${Date.now()}`,
          fee: 0,
          total: data.finalAmount
        };
        setReceipt(newReceipt);
        setIsSuccess(true);
        toast.success('Electricity payment successful!');
      } else {
        toast.error(data.error || 'Payment failed');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
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
            You have successfully paid <span className="font-bold text-emerald-600">₦{receipt.amount.toLocaleString()}</span> for meter {meterNumber}.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setReceipt(receipt)}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
            >
              View Receipt
            </button>
            <button 
              onClick={() => {
                setIsSuccess(false);
                setReceipt(null);
                setMeterNumber('');
                setAmount('');
                setProvider('');
              }}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              Make Another Payment
            </button>
          </div>
        </div>
        <AnimatePresence>
          {receipt && <Receipt receipt={receipt} onClose={() => setReceipt(null)} />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="premium-card p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 shrink-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Electricity Bill</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Prepaid/Postpaid recharge</p>
          </div>
        </div>

        <form onSubmit={handleInitiatePayment} className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all relative overflow-hidden group ${
                    provider === p.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {provider === p.id && (
                    <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-500/10 rounded-bl-full flex items-start justify-end p-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </div>
                  )}
                  <span className={`font-bold text-xs ${provider === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {p.name.split(' (')[0]}
                  </span>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter mt-0.5">
                    {p.name.match(/\(([^)]+)\)/)?.[1] || ''}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Meter Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Meter Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['prepaid', 'postpaid'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMeterType(type)}
                  className={`py-3 rounded-xl border-2 font-black capitalize transition-all text-sm ${
                    meterType === type
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-lg'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Meter Number */}
          <div>
            <label htmlFor="meter" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Meter Number</label>
            <input
              type="text"
              id="meter"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 11-13 digit meter number"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold text-base"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Amount (₦)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-black text-lg">₦</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="500"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-black text-lg"
                required
              />
            </div>
            {user.isAgent && amount && Number(amount) >= 500 && (
              <div className="mt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                Agent Rate: ₦{(Number(amount) * 0.98).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!provider || !meterNumber || !amount || isLoading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 active:scale-95 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₦${amount ? (user.isAgent ? (Number(amount) * 0.98) : Number(amount)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`
            )}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {showPinModal && (
          <PinModal 
            onSuccess={handlePaymentSuccess} 
            onCancel={() => setShowPinModal(false)}
            isBiometricEnabled={user.isBiometricEnabled}
            actionLabel="Electricity Bill"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
