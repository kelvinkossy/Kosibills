import React from 'react';
import { ShieldCheck, X, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BiometricModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export default function BiometricModal({ 
  onSuccess, 
  onCancel, 
  title = "Biometric Authentication", 
  description = "Verify your identity to continue" 
}: BiometricModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="flex justify-between items-start mb-8">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Fingerprint className="w-8 h-8" />
          </div>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-2 mb-8">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onSuccess}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            Verify Identity
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
          >
            Maybe Later
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" />
          Secure Biometric Verification
        </div>
      </motion.div>
    </div>
  );
}
