import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { X, Lock, Fingerprint, AlertCircle } from 'lucide-react';

import { storage } from '../../utils/storage';

interface PinModalProps {
  onSuccess: (pin?: string, isBiometric?: boolean) => void;
  onCancel: () => void;
  isBiometricEnabled?: boolean;
  actionLabel?: string;
}

export default function PinModal({ onSuccess, onCancel, isBiometricEnabled = false, actionLabel = 'Confirm Transaction' }: PinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (isNaN(Number(value)) && value !== '') return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value !== '' && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData) {
      const newPin = [...pin];
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      
      const nextIndex = Math.min(pastedData.length, 3);
      const nextInput = document.getElementById(`pin-${nextIndex}`);
      nextInput?.focus();
    }
  };

  const handleConfirm = async () => {
    const enteredPin = pin.join('');
    if (enteredPin.length < 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    setIsVerifying(true);

    try {
      // Get user from local storage to get ID
      const userStr = storage.get('kosi_user');
      if (!userStr) throw new Error('User session not found');
      const user = JSON.parse(userStr);

      const response = await fetch('/api/user/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pin: enteredPin })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess(enteredPin);
      } else {
        toast.error(data.error || 'Invalid transaction PIN. Please try again.');
        setPin(['', '', '', '']);
        document.getElementById('pin-0')?.focus();
      }
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    document.getElementById('pin-0')?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
      >
        <div className="p-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400 mb-2">
              <Lock className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Enter Transaction PIN</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Verify your identity to complete this {actionLabel.toLowerCase()}</p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center gap-4">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="password"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-14 h-16 text-center text-3xl font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
                />
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={isVerifying}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Confirm & Pay</>
                )}
              </button>
              
              {isBiometricEnabled && (
                <button
                  type="button"
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-5 h-5" />
                  Use Biometrics
                </button>
              )}

              <button
                onClick={onCancel}
                className="w-full py-3 text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    onCancel();
                    toast('Please contact support to reset your PIN', { icon: 'ℹ️' });
                  }}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Forgot PIN?
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
