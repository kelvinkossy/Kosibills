import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smartphone, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { User } from '../../types';

interface OnboardingProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(user.phone ? 2 : 1);
  const [phone, setPhone] = useState(user.phone || '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[\s+]/g, '');
    if (cleanPhone.length < 10 || !/^\d+$/.test(cleanPhone)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, phone: cleanPhone })
      });
      
      if (response.ok) {
        toast.success('Phone number saved!');
        setStep(2);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update phone number');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pin })
      });
      
      if (response.ok) {
        toast.success('PIN set successfully!');
        onComplete({ ...user, phone: phone.replace(/[\s+]/g, ''), pin });
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to set PIN');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-96 bg-emerald-900 dark:bg-emerald-950 -skew-y-6 transform origin-top-left -translate-y-24 z-0"></div>
      
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-10 px-6 shadow-2xl shadow-emerald-900/20 sm:rounded-[2.5rem] sm:px-12 border border-white/20 dark:border-slate-800/50"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
              Complete Profile
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
              {step === 1 ? 'Add your phone number to secure your account' : 'Set a 4-digit PIN for transactions'}
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-400">
                <span>Step {step} of 2</span>
                <span>{step === 1 ? '50%' : '100%'}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: step === 1 ? '50%' : '100%' }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                />
              </div>
            </div>
          </div>

          {step === 1 ? (
            <motion.form 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6" 
              onSubmit={handlePhoneSubmit}
            >
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Smartphone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold"
                    placeholder="08012345678"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-70 active:scale-95"
              >
                {isLoading ? 'Saving...' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.form>
          ) : (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6" 
              onSubmit={handlePinSubmit}
            >
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Create PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold tracking-[1em] text-center"
                    placeholder="••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Confirm PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <CheckCircle2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold tracking-[1em] text-center"
                    placeholder="••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-70 active:scale-95"
              >
                {isLoading ? 'Saving...' : 'Complete Setup'}
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
