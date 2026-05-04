import { apiFetch } from '../../utils/api';
import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, Loader2, Smartphone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Logo from '../common/Logo';
import { auth } from '../../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { haptics } from '../../utils/haptics';
import PageTransition from '../ui/PageTransition';

interface AuthProps {
  onLogin: (user: any) => void;
  initialMode?: 'login' | 'signup';
}

const FEATURES = [
  { icon: '⚡', text: 'Instant bill payments' },
  { icon: '🔒', text: 'Bank-grade security' },
  { icon: '🎁', text: 'Earn rewards daily' },
  { icon: '📞', text: '24/7 customer support' },
];

export default function Auth({ onLogin, initialMode = 'login' }: AuthProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [is2FAMode, setIs2FAMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', referralCode: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length >= 8) s += 30;
    else if (pass.length >= 6) s += 15;
    if (/[A-Z]/.test(pass)) s += 25;
    if (/[0-9]/.test(pass)) s += 25;
    if (/[^A-Za-z0-9]/.test(pass)) s += 20;
    return Math.min(s, 100);
  };

  const strength = getPasswordStrength(formData.password);
  const strengthColor = strength < 30 ? '#ef4444' : strength < 60 ? '#f97316' : strength < 80 ? '#eab308' : '#10b981';
  const strengthLabel = strength < 30 ? 'Weak' : strength < 60 ? 'Fair' : strength < 80 ? 'Good' : 'Strong';

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('Google user:', { displayName: user.displayName, email: user.email, photoURL: user.photoURL });
      
      const response = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.displayName, email: user.email, profilePhoto: user.photoURL, uid: user.uid })
      });
      
      const data = await response.json();
      console.log('Google auth response:', data);
      
      if (response.ok) { 
        onLogin(data.user); 
        toast.success('Signed in with Google!'); 
      } else { 
        toast.error(data.error || 'Google sign-in failed'); 
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      const errorMessage = error.code === 'auth/popup-closed-by-user' 
        ? 'Sign-in was cancelled' 
        : error.code === 'auth/unauthorized-domain'
        ? 'This domain is not authorized for Google Auth. Please add it to Firebase console.'
        : error.message || 'Google sign-in failed';
      toast.error(errorMessage);
    } finally { 
      setIsLoading(false); 
    }
  };

  const setError = (msg: string) => { setErrorMsg(msg); toast.error(msg); };
  const clearError = () => setErrorMsg('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (!isLogin && !isForgotMode) {
      if (formData.name.trim().length < 2) { setError('Name must be at least 2 characters'); return; }
      const cleanPhone = formData.phone.replace(/[\s+]/g, '');
      if (cleanPhone.length < 10 || !/^\d+$/.test(cleanPhone)) { setError('Enter a valid phone number'); return; }
    }
    const cleanEmail = formData.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError('Enter a valid email address'); return; }
    if (!isForgotMode && formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setIsLoading(true);
    try {
      if (is2FAMode) {
        const r = await apiFetch('/api/auth/verify-2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: twoFactorEmail, code: twoFactorCode }) });
        const d = await r.json();
        if (r.ok) { onLogin(d.user); toast.success('Logged in!'); } else { setError(d.error || 'Verification failed'); }
        return;
      }
      let endpoint = '';
      let body: any = {};
      if (isForgotMode) { endpoint = '/api/auth/forgot-password'; body = { email: cleanEmail }; }
      else if (isLogin) { endpoint = '/api/auth/login'; body = { email: cleanEmail, password: formData.password }; }
      else { endpoint = '/api/auth/register'; body = { name: formData.name, email: cleanEmail, phone: formData.phone, password: formData.password, referralCode: formData.referralCode }; }
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (r.ok) {
        clearError();
        if (isForgotMode) { toast.success(d.message || 'Reset link sent!'); setIsForgotMode(false); setIsLogin(true); }
        else if (d.requires2FA) { setIs2FAMode(true); setTwoFactorEmail(d.email); toast.success(d.message); }
        else { onLogin(d.user); toast.success(isLogin ? 'Welcome back!' : 'Account created!'); }
      } else { setError(d.error || 'Something went wrong. Please try again.'); }
    } catch { setError('Network error. Please check your connection and try again.'); }
    finally { setIsLoading(false); }
  };

  if (is2FAMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Verify Identity</h2>
            <p className="text-slate-400 text-sm mb-8">Enter the 6-digit code sent to <span className="text-emerald-400 font-bold">{twoFactorEmail}</span></p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text" maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[0.5em] py-5 bg-white/10 border border-white/20 rounded-2xl text-white font-black focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all placeholder:text-white/20"
                autoFocus
              />
              <button type="submit" disabled={isLoading || twoFactorCode.length !== 6}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
              </button>
              <button type="button" onClick={() => setIs2FAMode(false)} className="w-full text-slate-400 hover:text-white text-sm font-bold transition-colors py-2">
                ← Back to Login
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex flex-col lg:flex-row">
      {/* Left brand panel - hidden on mobile, shown on large screens */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/10"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12" />
            <span className="text-white font-black text-2xl tracking-tight">Kosi Bills</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
              Pay Bills.<br /><span className="text-emerald-400">Earn Rewards.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Pay all your bills, manage your finances, and earn rewards — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-white/80 font-semibold text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-500 text-sm">Fast, secure, and reliable bill payments.</p>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex flex-col justify-center p-6 lg:p-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex justify-center mb-8">
          <div className="flex flex-col items-center gap-3">
            <Logo className="w-16 h-16" />
            <span className="text-white font-black text-2xl tracking-tight">Kosi Bills</span>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={isLogin ? 'login' : isForgotMode ? 'forgot' : 'register'}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="bg-white/8 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">

              <div className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {isForgotMode ? 'Reset password' : isLogin ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-slate-400 mt-1 font-medium">
                  {isForgotMode ? 'Enter your email to receive a reset link'
                    : isLogin ? 'Sign in to your Kosi Bills account'
                    : 'Create your free account today'}
                </p>
              </div>

              {!isForgotMode && (
                <>
                  <button onClick={handleGoogleSignIn} disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-white hover:bg-slate-50 rounded-2xl font-bold text-slate-800 transition-all active:scale-95 disabled:opacity-70 mb-5 shadow-lg">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Continue with Google
                  </button>
                  <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative flex justify-center"><span className="px-3 bg-transparent text-slate-500 text-sm font-medium">or with email</span></div>
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && !isForgotMode && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="text" required value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3.5 bg-white/8 border border-white/15 rounded-xl text-white placeholder:text-slate-600 font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm"
                          placeholder="John Doe" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="tel" required value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-3.5 bg-white/8 border border-white/15 rounded-xl text-white placeholder:text-slate-600 font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm"
                          placeholder="08012345678" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" required value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3.5 bg-white/8 border border-white/15 rounded-xl text-white placeholder:text-slate-600 font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm"
                      placeholder="you@example.com" autoComplete="email" />
                  </div>
                </div>

                {!isForgotMode && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                      {isLogin && (
                        <button type="button" onClick={() => { setIsForgotMode(true); clearError(); }} className="text-xs text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type={showPassword ? 'text' : 'password'} required value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-12 py-3.5 bg-white/8 border border-white/15 rounded-xl text-white placeholder:text-slate-600 font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm"
                        placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {!isLogin && formData.password && (
                      <div className="mt-2 space-y-1">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${strength}%` }}
                            className="h-full rounded-full transition-all duration-500"
                            style={{ backgroundColor: strengthColor }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold" style={{ color: strengthColor }}>
                          <span>Password strength</span><span>{strengthLabel}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isLogin && !isForgotMode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Referral Code <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
                    <input type="text" value={formData.referralCode}
                      onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3.5 bg-white/8 border border-white/15 rounded-xl text-white placeholder:text-slate-600 font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm tracking-widest"
                      placeholder="KOSI-XXXX" />
                  </div>
                )}

                {errorMsg && (
                  <div className="flex items-start gap-2.5 bg-red-500/15 border border-red-500/40 rounded-xl px-4 py-3">
                    <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                    <p className="text-red-300 text-sm font-semibold leading-snug">{errorMsg}</p>
                  </div>
                )}

                <button type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-black rounded-2xl transition-all active:scale-95 shadow-xl shadow-emerald-500/20 text-base mt-2">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <>{isForgotMode ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}<ArrowRight className="w-5 h-5" /></>}
                </button>
              </form>

              <div className="mt-6 text-center">
                {isForgotMode ? (
                  <button onClick={() => { setIsForgotMode(false); clearError(); }} className="text-slate-400 hover:text-white font-bold text-sm transition-colors">
                    ← Back to Sign In
                  </button>
                ) : (
                  <p className="text-slate-400 text-sm">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button onClick={() => { setIsLogin(!isLogin); setFormData({ name: '', email: '', phone: '', password: '', referralCode: '' }); clearError(); }}
                      className="text-emerald-400 font-black hover:text-emerald-300 transition-colors">
                      {isLogin ? 'Sign up free' : 'Sign in'}
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {!isLogin && (
            <p className="text-center text-slate-600 text-xs mt-4 leading-relaxed">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          )}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
