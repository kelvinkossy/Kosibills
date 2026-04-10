import { apiFetch } from '../../utils/api';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Send, Search, User as UserIcon, Lock, Loader2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { User, View } from '../../types';

interface TransferProps {
  user: User;
  setView: (view: View) => void;
  setUser: (user: User) => void;
}

type Step = 'find' | 'amount' | 'pin' | 'success';

interface FoundUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier?: string;
}

const PRESETS = [500, 1000, 2000, 5000, 10000, 20000];

export default function Transfer({ user, setView, setUser }: TransferProps) {
  const [step, setStep] = useState<Step>('find');
  const [phone, setPhone] = useState('');
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txRef, setTxRef] = useState('');

  const handleSearch = async () => {
    if (!phone.trim()) { toast.error('Enter a phone number'); return; }
    setIsLoading(true);
    try {
      const r = await apiFetch(`/api/users/find?phone=${encodeURIComponent(phone.trim())}`, { credentials: 'include' });
      const d = await r.json();
      if (r.ok && d.user) {
        if (d.user.id === user.id) { toast.error("You can't transfer to yourself"); return; }
        setFoundUser(d.user);
        setStep('amount');
      } else {
        toast.error(d.error || 'No user found with that phone number');
      }
    } catch { toast.error('Network error. Try again.'); }
    finally { setIsLoading(false); }
  };

  const handleAmountContinue = () => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt < 50) { toast.error('Minimum transfer is ₦50'); return; }
    if (amt > user.balance) { toast.error('Insufficient balance'); return; }
    if (amt > (user.dailyTransferLimit || 200000)) { toast.error(`Exceeds daily limit of ₦${(user.dailyTransferLimit || 200000).toLocaleString()}`); return; }
    if (!user.pin) { toast.error('Please set a transaction PIN in settings first'); return; }
    setStep('pin');
  };

  const handleTransfer = async () => {
    if (pin.length !== 4) { toast.error('Enter your 4-digit PIN'); return; }
    setIsLoading(true);
    try {
      const r = await apiFetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ senderId: user.id, recipientId: foundUser!.id, amount: Number(amount), pin, note })
      });
      const d = await r.json();
      if (r.ok) {
        setTxRef(d.reference || 'KB-TXN-' + Date.now());
        setUser({ ...user, balance: user.balance - Number(amount) });
        setStep('success');
        toast.success('Transfer successful!');
      } else {
        toast.error(d.error || 'Transfer failed');
        if (d.error?.toLowerCase().includes('pin')) setPin('');
      }
    } catch { toast.error('Network error. Please try again.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => step === 'find' ? setView('dashboard') : setStep(step === 'amount' ? 'find' : step === 'pin' ? 'amount' : 'find')}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="font-black text-slate-800 dark:text-white text-lg">Send Money</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Transfer to any Kosi Bills user instantly</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex gap-2">
        {(['find', 'amount', 'pin'] as Step[]).map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            step === 'success' || ['find','amount','pin'].indexOf(step) >= i
              ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
          }`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Find user */}
        {step === 'find' && (
          <motion.div key="find" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-black text-slate-800 dark:text-white text-xl">Find Recipient</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter the recipient's phone number</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white font-bold text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. 08012345678"
                  autoFocus
                />
              </div>
              <button onClick={handleSearch} disabled={isLoading || !phone.trim()}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> Find User</>}
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Only Kosi Bills users can receive transfers. Both parties must have verified accounts.</p>
            </div>
          </motion.div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && foundUser && (
          <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            {/* Recipient card */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow">
                <span className="text-white font-black text-lg">{foundUser.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-black text-slate-800 dark:text-white">{foundUser.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{foundUser.phone}</p>
              </div>
              <div className="ml-auto">
                <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full">{foundUser.tier || 'Basic'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Amount to Send</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xl">₦</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white font-black text-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="0.00" min="50" autoFocus />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Balance: <span className="font-bold text-emerald-600 dark:text-emerald-400">₦{user.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></p>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setAmount(String(p))}
                    className={`py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                      amount === String(p)
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}>
                    ₦{p.toLocaleString()}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Note <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={100}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white font-medium text-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="What's this for?" />
              </div>

              <button onClick={handleAmountContinue} disabled={!amount || Number(amount) < 50}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                Continue <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: PIN */}
        {step === 'pin' && foundUser && (
          <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="font-black text-slate-800 dark:text-white text-xl">Confirm Transfer</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your 4-digit transaction PIN</p>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">To</span>
                <span className="font-bold text-slate-800 dark:text-white">{foundUser.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Amount</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">₦{Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              {note && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Note</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-right max-w-[60%] truncate">{note}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Fee</span>
                <span className="font-bold text-slate-800 dark:text-white">₦0.00</span>
              </div>
            </div>

            <div>
              <input type="password" inputMode="numeric" maxLength={4} value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full text-center text-4xl tracking-[1em] py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white font-black focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="••••" autoFocus />
            </div>

            <button onClick={handleTransfer} disabled={isLoading || pin.length !== 4}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Send ₦{Number(amount).toLocaleString()}</>}
            </button>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && foundUser && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <div>
              <h2 className="font-black text-slate-800 dark:text-white text-2xl">Transfer Sent!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">₦{Number(amount).toLocaleString()} sent to {foundUser.name}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Reference</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">{txRef}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Successful</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setStep('find'); setPhone(''); setFoundUser(null); setAmount(''); setNote(''); setPin(''); }}
                className="py-3.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                Send Again
              </button>
              <button onClick={() => setView('dashboard')}
                className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all active:scale-95 text-sm">
                Go Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
