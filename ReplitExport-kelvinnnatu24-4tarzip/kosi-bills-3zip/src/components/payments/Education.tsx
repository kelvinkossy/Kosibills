import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { GraduationCap, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import PinModal from '../common/PinModal';
import Receipt from '../common/Receipt';
import { User, View, Receipt as ReceiptType } from '../../types';

interface EducationProps {
  user: User;
  setUser: (user: User) => void;
  setView: (view: View) => void;
  retryData?: any;
  clearRetryData?: () => void;
}

export default function Education({ user, setUser, setView, retryData, clearRetryData }: EducationProps) {
  const [examType, setExamType] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);

  const exams = [
    { id: 'jamb', name: 'JAMB e-PIN', price: 4700 },
    { id: 'waec', name: 'WAEC Result Checker', price: 3500 },
    { id: 'neco', name: 'NECO Result Token', price: 1000 },
    { id: 'nabteb', name: 'NABTEB Result Checker', price: 1000 },
  ];

  const selectedExam = exams.find(e => e.id === examType);
  const totalAmount = selectedExam ? selectedExam.price * Number(quantity) : 0;

  const handleInitiatePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!examType || !phone || isLoading) return;
    
    if (phone.length !== 11 || !/^\d+$/.test(phone)) {
      toast.error('Please enter a valid 11-digit phone number');
      return;
    }

    if (user.balance < totalAmount) {
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
          type: 'Education',
          amount: totalAmount,
          description: `${selectedExam?.name} (${quantity} unit(s)) - ${phone}`,
          category: 'Education'
        })
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        const newReceipt: ReceiptType = {
          transactionId: data.transactionId,
          date: new Date().toLocaleString(),
          amount: data.finalAmount,
          type: 'Education Payment',
          recipient: phone,
          status: 'Success',
          reference: `REF-${Date.now()}`,
          fee: 0,
          total: data.finalAmount
        };
        setReceipt(newReceipt);
        setIsSuccess(true);
        toast.success(`${selectedExam?.name} purchased successfully!`);
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
          <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">Purchase Successful!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">
            Your exam PIN/Token has been sent to {phone}.
          </p>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setView('dashboard')}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-xl shadow-purple-600/20 active:scale-95 transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setExamType('');
                setQuantity('1');
                setPhone('');
                setReceipt(null);
              }}
              className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold active:scale-95 transition-all"
            >
              Buy Another PIN
            </button>
          </div>
        </div>
        
        {receipt && <Receipt receipt={receipt} onClose={() => setReceipt(null)} />}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
      <div className="premium-card p-8 sm:p-10 bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-400/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-xl">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Education & Exams</h2>
            <p className="text-purple-100 font-medium mt-1">Buy JAMB, WAEC, NECO PINs instantly</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleInitiatePayment} className="premium-card p-6 sm:p-8 space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Select Exam Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exams.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setExamType(e.id)}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-1 ${
                  examType === e.id 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="font-bold text-sm">{e.name}</span>
                <span className="text-lg font-black">₦{e.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>

        {examType && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6 pt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium dark:text-white"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Recipient Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="0801 234 5678"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                The PIN/Token will be sent to the recipient phone number via SMS.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Total Amount:</span>
                <span className="text-xl font-black text-purple-700 dark:text-purple-400">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
              {user.isAgent && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                  <CheckCircle2 className="w-4 h-4" />
                  Agent Rate: You pay ₦{(totalAmount * 0.98).toLocaleString(undefined, { minimumFractionDigits: 2 })} (2% discount)
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !phone || !examType}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-xl shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Processing...' : `Pay ₦${(user.isAgent ? (totalAmount * 0.98) : totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              {!isLoading && <ChevronRight className="w-5 h-5" />}
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
            actionLabel="Education Payment"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
