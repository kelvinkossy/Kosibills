import { apiFetch } from '../../utils/api';
import { useState, FormEvent, useEffect } from 'react';
import { Wifi, CheckCircle2, AlertCircle, Loader2, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import PinModal from '../common/PinModal';
import Receipt from '../common/Receipt';
import { User, View, Receipt as ReceiptType } from '../../types';
import { NETWORKS } from '../../constants';

interface DataProps {
  user: User;
  setUser: (user: User) => void;
  setView: (view: View) => void;
  retryData?: any;
  clearRetryData?: () => void;
}

export default function Data({ user, setUser, setView, retryData, clearRetryData }: DataProps) {
  const [networks, setNetworks] = useState<any[]>([]);
  const [network, setNetwork] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);

  const [activeCategory, setActiveCategory] = useState('Monthly');

  useEffect(() => {
    fetch('/api/bill-services/Data')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNetworks(data.services.map((s: any) => ({
            id: s.provider_id,
            name: s.provider_name,
            color: s.provider_id === 'mtn' ? 'bg-yellow-400' : s.provider_id === 'airtel' ? 'bg-red-600' : s.provider_id === 'glo' ? 'bg-green-600' : 'bg-emerald-900',
            text: s.provider_id === 'mtn' ? 'text-black' : 'text-white',
            packages: s.packages
          })));
        }
      })
      .catch(err => console.error('Failed to fetch data providers:', err));
  }, []);

  useEffect(() => {
    if (retryData && retryData.phone && retryData.selectedPlan && retryData.network) {
      setPhone(retryData.phone);
      setNetwork(retryData.network);
      setSelectedPlan(retryData.selectedPlan);
      if (clearRetryData) clearRetryData();
    }
  }, [retryData, clearRetryData]);

  useEffect(() => {
    fetch(`/api/beneficiaries/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBeneficiaries(data.beneficiaries.filter((b: any) => b.service_type === 'Data'));
        }
      })
      .catch(err => console.error('Failed to fetch beneficiaries:', err));
  }, [user.id]);

  const currentNetwork = networks.find(n => n.id === network);
  const categories = currentNetwork ? [...new Set(currentNetwork.packages.map((p: any) => p.category))] as string[] : [];
  const currentPlans = currentNetwork ? currentNetwork.packages.filter((p: any) => p.category === activeCategory) : [];
  
  // Find plan details across all categories for the selected network
  const planDetails = currentNetwork ? currentNetwork.packages.find((p: any) => p.id.toString() === selectedPlan.toString()) : null;

  const handleInitiatePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!network || !phone || !selectedPlan || isLoading) return;
    
    if (phone.length !== 11 || !/^\d+$/.test(phone)) {
      toast.error('Please enter a valid 11-digit phone number');
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
          type: 'Data',
          description: `${NETWORKS.find(n => n.id === network)?.name} ${planDetails?.name} Data - ${phone}`,
          amount: planDetails?.price,
          metadata: { network, phone, selectedPlan, amount: planDetails?.price }
        })
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        const newReceipt: ReceiptType = {
          transactionId: data.transactionId,
          date: new Date().toLocaleString(),
          amount: data.finalAmount,
          type: 'Data Bundle',
          recipient: phone,
          status: 'Success',
          reference: `REF-${Date.now()}`,
          fee: 0,
          total: data.finalAmount
        };
        setReceipt(newReceipt);
        setIsSuccess(true);
        toast.success('Data purchase successful!');
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
            You have successfully purchased <span className="font-bold text-emerald-600">{planDetails?.name}</span> for {phone}.
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
                setSelectedPlan('');
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
      <div className="premium-card p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Buy Data</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Fast and reliable bundles</p>
          </div>
        </div>

        <form onSubmit={handleInitiatePayment} className="space-y-4">
          {/* Network Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Network</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {networks.map((net) => (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => {
                    setNetwork(net.id);
                    setSelectedPlan('');
                    if (net.packages.length > 0) {
                      setActiveCategory(net.packages[0].category);
                    }
                  }}
                  className={`relative h-16 rounded-xl border-2 transition-all flex items-center justify-center font-black text-xs ${
                    network === net.id 
                      ? `border-emerald-500 ${net.color} ${net.text} shadow-lg scale-105 z-10` 
                      : `border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600`
                  }`}
                >
                  {net.name}
                  {network === net.id && (
                    <motion.div 
                      layoutId="active-net-data"
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

          {/* Data Plan Selection */}
          {network && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select Plan Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                      }}
                      className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${
                        activeCategory === cat
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Select {activeCategory} Plan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPlans.map((plan: any) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${
                        selectedPlan === plan.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {selectedPlan === plan.id && (
                        <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-full flex items-start justify-end p-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-slate-800 dark:text-slate-100 text-base tracking-tight">{plan.name}</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₦{plan.price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wider">Validity: {plan.validity}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {user.isAgent && selectedPlan && planDetails && (
                <div className="mt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Agent Rate: ₦{(planDetails.price * 0.98).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              )}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={!network || phone.length < 10 || !selectedPlan || isLoading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 active:scale-95 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₦${planDetails?.price ? (user.isAgent ? (planDetails.price * 0.98) : planDetails.price).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`
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
            actionLabel="Data Purchase"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
