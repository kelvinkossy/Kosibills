import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Logo from '../common/Logo';

interface ResetPasswordProps {
  onComplete: () => void;
}

export default function ResetPassword({ onComplete }: ResetPasswordProps) {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast.error('Invalid reset link');
      onComplete();
    }
  }, [onComplete]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-96 bg-emerald-900 dark:bg-emerald-950 -skew-y-6 transform origin-top-left -translate-y-24 z-0"></div>
        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
          </motion.div>
          <h2 className="text-4xl font-black tracking-tighter text-white mb-4">Password Reset!</h2>
          <p className="text-emerald-100/80 font-medium mb-8">Your password has been updated successfully. Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-96 bg-emerald-900 dark:bg-emerald-950 -skew-y-6 transform origin-top-left -translate-y-24 z-0"></div>
      
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-8">
          <Logo className="w-24 h-24" />
        </motion.div>
        <h2 className="text-center text-4xl font-black tracking-tighter text-white mb-2">New Password</h2>
        <p className="text-center text-emerald-100/80 text-sm mb-8 font-medium">Create a strong password for your account</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-10 px-6 shadow-2xl shadow-emerald-900/20 sm:rounded-[2.5rem] sm:px-12 border border-white/20 dark:border-slate-800/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-5 px-6 border border-transparent rounded-2xl shadow-xl shadow-emerald-600/20 text-lg font-black text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70 active:scale-95"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Update Password'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onComplete}
                className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
