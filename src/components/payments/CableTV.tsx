import { apiFetch } from '../../utils/api';
import { useState, FormEvent, useEffect } from 'react';
import { Tv, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import PinModal from '../common/PinModal';
import Receipt from '../common/Receipt';
import { View, User, Receipt as ReceiptType } from '../../types';

interface CableTVProps {
  user: User;
  setUser: (user: User) => void;
  setView: (view: View) => void;
  retryData?: any;
  clearRetryData?: () => void;
}

export default function CableTV({ user, setUser, setView, retryData, clearRetryData }: CableTVProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [provider, setProvider] = useState('');
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);

  useEffect(() => {
    fetch('/api/bill-services/Cable TV')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProviders(data.services.map((s: any) => ({
            id: s.provider_id,
            name: s.provider_name,
            color: s.provider_id === 'dstv' ? 'bg-blue-600' : s.provider_id === 'gotv' ? 'bg-green-600' : 'bg-orange-600',
            packages: s.packages
          })));
        }
      })
      .catch(err => console.error('Failed to fetch cable TV providers:', err));
  }, []);

  useEffect(() => {
    if (retryData && retryData.provider && retryData.smartcardNumber && retryData.selectedPackage) {
      setProvider(retryData.provider);
      setSmartcardNumber(retryData.smartcardNumber);
      setSelectedPackage(retryData.selectedPackage);
      if (clearRetryData) clearRetryData();
    }
  }, [retryData, clearRetryData]);

  const currentProvider = providers.find(p => p.id === provider);
  const currentPackages = currentProvider ? currentProvider.packages : [];
  const packageDetails = currentPackages.find((p: any) => p.id.toString() === selectedPackage.toString());

  const handleInitiatePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!provider || !smartcardNumber || !selectedPackage || isLoading) return;
    
    if (smartcardNumber.length < 10 || !/^\d+$/.test(smartcardNumber)) {
      toast.error('Please enter a valid smartcard number');
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
          type: 'Cable TV',
          description: `${providers.find(p => p.id === provider)?.name} ${packageDetails?.name} - ${smartcardNumber}`,
          amount: packageDetails?.price,
          metadata: { provider, smartcardNumber, selectedPackage, amount: packageDetails?.price }
        })
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        const newReceipt: ReceiptType = {
          transactionId: data.transactionId,
          date: new Date().toLocaleString(),
          amount: data.finalAmount,
          type: 'Cable TV Subscription',
          recipient: smartcardNumber,
          status: 'Success',
          reference: `REF-${Date.now()}`,
          fee: 0,
          total: data.finalAmount
        };
        setReceipt(newReceipt);
        setIsSuccess(true);
        toast.success('Cable TV subscription successful!');
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
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">Subscription Successful!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">
            You have successfully subscribed to <span className="font-bold text-emerald-600">{packageDetails?.name}</span> for smartcard {smartcardNumber}.
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
                setSmartcardNumber('');
                setSelectedPackage('');
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
          <div className="w-12 h-12 shrink-0 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Cable TV</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Renew subscriptions</p>
          </div>
        </div>

        <form onSubmit={handleInitiatePayment} className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProvider(p.id);
                    setSelectedPackage('');
                  }}
                  className={`relative h-16 rounded-xl border-2 transition-all flex items-center justify-center font-black text-xs ${
                    provider === p.id 
                      ? `border-emerald-500 ${p.color} text-white shadow-lg scale-105 z-10` 
                      : `border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600`
                  }`}
                >
                  {p.name}
                  {provider === p.id && (
                    <motion.div 
                      layoutId="active-provider-cable"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg"
                    >
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Smartcard Number */}
          <div>
            <label htmlFor="smartcard" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Smartcard / IUC Number</label>
            <input
              type="text"
              id="smartcard"
              value={smartcardNumber}
              onChange={(e) => setSmartcardNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 10-11 digit number"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold text-base"
              required
            />
          </div>

          {/* Package Selection */}
          {provider && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Package</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentPackages.map((pkg: any) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${
                      selectedPackage === pkg.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {selectedPackage === pkg.id && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-full flex items-start justify-end p-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-black text-slate-800 dark:text-slate-100 text-base tracking-tight">{pkg.name}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₦{pkg.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wider">Validity: 30 Days</span>
                    </div>
                  </button>
                ))}
              </div>
              {user.isAgent && selectedPackage && packageDetails && (
                <div className="mt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Agent Rate: ₦{(packageDetails.price * 0.98).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              )}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={!provider || !smartcardNumber || !selectedPackage || isLoading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 active:scale-95 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₦${packageDetails?.price ? (user.isAgent ? (packageDetails.price * 0.98) : packageDetails.price).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`
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
            actionLabel="Cable TV Subscription"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
