import { useState, FormEvent, useEffect } from 'react';
import { PhoneCall, CheckCircle2, AlertCircle, Loader2, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import PinModal from '../common/PinModal';
import Receipt from '../common/Receipt';
import { User, View, Receipt as ReceiptType } from '../../types';
import { NETWORKS } from '../../constants';

interface AirtimeProps {
  user: User;
  setUser: (user: User) => void;
  setView: (view: View) => void;
  retryData?: any;
  clearRetryData?: () => void;
}

export default function Airtime({ user, setUser, setView, retryData, clearRetryData }: AirtimeProps) {
  const [network, setNetwork] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);

  useEffect(() => {
    if (retryData && retryData.phone && retryData.amount && retryData.network) {
      setPhone(retryData.phone);
      setAmount(retryData.amount.toString());
      setNetwork(retryData.network);
      if (clearRetryData) clearRetryData();
    }
  }, [retryData, clearRetryData]);

  useEffect(() => {
    fetch(`/api/beneficiaries/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBeneficiaries(data.beneficiaries.filter((b: any) => b.service_type === 'Airtime'));
        }
      })
      .catch(err => console.error('Failed to fetch beneficiaries:', err));
  }, [user.id]);

  const handleInitiatePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!network || !phone || !amount || isLoading) return;
    
    if (phone.length !== 11 || !/^\d+$/.test(phone)) {
      toast.error('Please enter a valid 11-digit phone number');
      return;
    }
    
    if (Number(amount) < 50) {
      toast.error('Minimum airtime amount is ₦50');
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
          type: 'Airtime',
          description: `${NETWORKS.find(n => n.id === network)?.name} Airtime - ${phone}`,
          amount: Number(amount),
          metadata: { network, phone, amount: Number(amount) }
        })
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        const newReceipt: ReceiptType = {
          transactionId: data.transactionId,
          date: new Date().toLocaleString(),
          amount: data.finalAmount,
          type: 'Airtime Top-up',
          recipient: phone,
          status: 'Success',
          reference: `REF-${Date.now()}`,
          fee: 0,
          total: data.finalAmount
        };
        setReceipt(newReceipt);
        setIsSuccess(true);
        toast.success('Airtime purchase successful!');
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
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">Purchase Successful!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">
            You have successfully recharged <span className="font-bold text-emerald-600">₦{receipt.amount.toLocaleString()}</span> to {phone}.
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
                setPhone('');
                setAmount('');
                setNetwork('');
              }}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              Make Another Purchase
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
      <button 
        onClick={() => setView('bills')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4 transition-colors font-medium group"
        aria-label="Back to bills"
      >
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
          <PhoneCall className="w-5 h-5 rotate-180" />
        </div>
        Back to Bills
      </button>

      <div className="premium-card p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Buy Airtime</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Instant recharge</p>
          </div>
        </div>

        <form onSubmit={handleInitiatePayment} className="space-y-4">
          {/* Network Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Network</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {NETWORKS.map((net) => (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => setNetwork(net.id)}
                  className={`relative h-16 rounded-xl border-2 transition-all flex items-center justify-center font-black text-xs ${
                    network === net.id 
                      ? `border-emerald-500 ${net.color} ${net.text} shadow-lg scale-105 z-10` 
                      : `border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600`
                  }`}
                >
                  {net.name}
                  {network === net.id && (
                    <motion.div 
                      layoutId="active-net"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg"
                    >
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Phone Number</label>
              <button
                type="button"
                onClick={() => { setPhone(user.phone || ''); }}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/30"
              >
                <UserIcon className="w-3 h-3" />
                Buy for Self
              </button>
            </div>
            <div className="relative">
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="0801 234 5678"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold text-base"
                required
              />
              {beneficiaries.length > 0 && (
                <select
                  onChange={(e) => {
                    const b = beneficiaries.find(b => b.id === Number(e.target.value));
                    if (b) {
                      setPhone(b.phone);
                      setNetwork(b.provider.toLowerCase());
                    }
                  }}
                  className="absolute right-2 top-2 bottom-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Beneficiary</option>
                  {beneficiaries.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>
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
                min="50"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-black text-lg"
                required
              />
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {['100', '200', '500', '1000', '2000', '5000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className="px-4 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95"
                >
                  ₦{amt}
                </button>
              ))}
            </div>
            {user.isAgent && amount && Number(amount) >= 50 && (
              <div className="mt-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                <CheckCircle2 className="w-3 h-3" />
                Agent Rate: ₦{(Number(amount) * 0.98).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!network || phone.length < 10 || !amount || isLoading}
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
            actionLabel="Airtime Purchase"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
