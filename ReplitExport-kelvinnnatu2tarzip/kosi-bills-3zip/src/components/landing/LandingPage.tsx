import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import {
  Zap,
  Shield,
  Star,
  ChevronRight,
  Phone,
  Wifi,
  Lightbulb,
  Tv,
  Gift,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Globe,
  Menu,
  X,
  Clock,
  RefreshCw,
  Headphones,
} from 'lucide-react';
import Logo from '../common/Logo';
import heroGirl from '../../assets/hero-girl.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const services = [
  { icon: Phone, label: 'Airtime', desc: 'Top up MTN, Airtel, Glo, 9mobile instantly. Never run out of credit again.', color: 'from-blue-500 to-blue-600' },
  { icon: Wifi, label: 'Data Bundles', desc: 'Buy affordable daily, weekly, and monthly data plans from all networks.', color: 'from-purple-500 to-purple-600' },
  { icon: Lightbulb, label: 'Electricity', desc: 'Pay NEPA/PHCN bills and buy prepaid tokens for any meter nationwide.', color: 'from-yellow-500 to-orange-500' },
  { icon: Tv, label: 'Cable TV', desc: 'Subscribe to DStv, GOtv, Startimes and Showmax without the stress.', color: 'from-red-500 to-pink-500' },
  { icon: Globe, label: 'Internet', desc: 'Pay Spectranet, Smile, ipNX and other broadband providers easily.', color: 'from-cyan-500 to-teal-500' },
  { icon: Gift, label: 'Earn Rewards', desc: 'Every payment earns you cashback points redeemable for discounts.', color: 'from-emerald-500 to-green-600' },
];

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast Payments',
    desc: 'No more waiting. Transactions go through in under 10 seconds — guaranteed. Pay at the last minute and still make it on time.',
  },
  {
    icon: Shield,
    title: 'Your Money is Safe',
    desc: 'Bank-grade 256-bit encryption protects every kobo you move. With PIN and 2FA protection, only you can access your account.',
  },
  {
    icon: Clock,
    title: 'Available 24/7',
    desc: 'Midnight or midday — Kosi Bills is always online. No downtime, no maintenance windows, just seamless service when you need it.',
  },
  {
    icon: Smartphone,
    title: 'All Devices. One Account.',
    desc: 'Log in from your phone, tablet, or computer. Your wallet, history, and rewards sync instantly across every device.',
  },
  {
    icon: RefreshCw,
    title: 'Never Miss a Bill Again',
    desc: 'Your transaction history keeps track of every payment you\'ve made. Repeat a bill payment in just two taps — no re-entering details.',
  },
  {
    icon: Headphones,
    title: 'Real Support Team',
    desc: 'Got an issue? Our support team responds fast. Raise a ticket directly from the app and track your resolution in real time.',
  },
];

const steps = [
  { num: '01', title: 'Create Your Account', desc: 'Sign up with your email and phone number in under 2 minutes. No paperwork, no branch visits.' },
  { num: '02', title: 'Fund Your Wallet', desc: 'Add money to your Kosi Bills wallet using your debit card or bank transfer — instantly and securely.' },
  { num: '03', title: 'Pay Any Bill', desc: 'Select the service you want to pay, enter the details, and confirm. It\'s done before you put your phone down.' },
];

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030f08] text-white overflow-x-hidden">

      {/* ─── NAVBAR ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 transition-all duration-300 ${scrolled ? 'bg-[#030f08]/95 shadow-lg shadow-black/30' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9" />
            <span className="text-xl font-bold tracking-tight text-white">
              Kosi <span className="text-emerald-400">Bills</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-5 py-2.5 text-sm font-semibold text-emerald-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
            >
              Get Started Free
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden mt-3 overflow-hidden"
            >
              <div className="bg-[#041a0c] border border-emerald-900/40 rounded-2xl p-4 flex flex-col gap-3">
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogin(); }}
                  className="w-full py-3 text-sm font-semibold text-emerald-300 hover:text-white transition-colors text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
                  className="w-full py-3 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all"
                >
                  Get Started Free
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-8 pt-24 pb-10 overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-600/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-700/10 rounded-full blur-[80px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,78,59,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,78,59,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-6 items-center">

            {/* Left: Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Nigeria's Trusted Bill Payment Platform
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-5"
              >
                Stop Stressing
                <br />
                About Bills.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">
                  Just Pay.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="text-base sm:text-lg text-slate-400 leading-relaxed mb-4 max-w-lg"
              >
                Kosi Bills brings all your payments into one simple, secure app.
                Airtime, data, electricity, cable TV, internet — handled in seconds,
                from anywhere in Nigeria.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-base text-slate-400 leading-relaxed mb-8 max-w-lg"
              >
                And every payment you make earns you reward points you can redeem for discounts.
                The more you pay, the more you save.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
              >
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button
                    onClick={onGetStarted}
                    className="group flex items-center justify-center gap-2 px-7 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-xl shadow-emerald-500/25"
                  >
                    Create Free Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={onLogin}
                    className="flex items-center justify-center gap-2 px-7 py-4 border border-slate-700 hover:border-emerald-600 text-slate-300 hover:text-white font-semibold rounded-2xl transition-all"
                  >
                    Sign In <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Free to join</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> No hidden fees</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Instant payments</span>
                </div>
              </motion.div>
            </div>

            {/* Right: Hero image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="relative">
                {/* Glow behind image */}
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-90 translate-y-8" />

                {/* Girl image */}
                <img
                  src={heroGirl}
                  alt="Happy Kosi Bills user"
                  className="relative z-10 w-full max-w-xs sm:max-w-sm lg:max-w-md rounded-3xl object-cover"
                  style={{ maxHeight: '540px', objectPosition: 'top' }}
                />

                {/* Floating card: Payment success */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5, type: 'spring' }}
                  className="absolute top-8 -left-4 sm:-left-10 z-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Payment Successful</p>
                      <p className="text-[10px] text-slate-300">Electricity • ₦5,000</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card: Reward points */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5, type: 'spring' }}
                  className="absolute bottom-16 -right-4 sm:-right-8 z-20 bg-[#041a0c] border border-emerald-700/40 rounded-2xl px-4 py-3 shadow-xl"
                >
                  <p className="text-[10px] text-slate-400 font-medium mb-1">Rewards Earned</p>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <p className="text-sm font-black text-white">+50 pts</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-4 sm:px-8 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-emerald-400 font-semibold text-sm tracking-widest uppercase mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Get Started in 3 Easy Steps</h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(100%-8px)] w-full h-px border-t border-dashed border-emerald-900/50 z-0" />
                )}
                <div className="relative z-10 bg-[#041a0c]/60 border border-emerald-900/30 rounded-3xl p-6">
                  <span className="text-4xl font-black text-emerald-500/30 mb-4 block">{step.num}</span>
                  <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-emerald-400 font-semibold text-sm tracking-widest uppercase mb-3">Everything You Need</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">One App. All Your Bills.</h2>
            <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
              Stop switching between multiple apps and bank websites. Kosi Bills brings all your essential payments into one clean, fast experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {services.map(({ icon: Icon, label, desc, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="bg-[#041a0c]/50 border border-emerald-900/30 hover:border-emerald-700/50 rounded-3xl p-5 sm:p-6 transition-colors"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base mb-1.5">{label}</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 px-4 sm:px-8 bg-[#020c05]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-emerald-400 font-semibold text-sm tracking-widest uppercase mb-3">Built Different</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Why People Choose{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">
                Kosi Bills
              </span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
              We built Kosi Bills from the ground up to solve real problems Nigerians face — slow payments, hidden charges, and poor support.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="flex gap-4 p-5 bg-[#041a0c]/60 border border-emerald-900/30 rounded-3xl hover:border-emerald-700/40 transition-colors"
              >
                <div className="flex-shrink-0 w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1.5">{title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-10 sm:p-14 text-center shadow-2xl shadow-emerald-900/40"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-black/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
                Your Bills Won't Pay Themselves.
              </h2>
              <p className="text-emerald-100/80 max-w-xl mx-auto mb-8 leading-relaxed">
                Create your free Kosi Bills account today and experience the easiest way to pay all your bills — fast, secure, and rewarding.
              </p>
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center gap-3 px-9 py-4 bg-white hover:bg-slate-50 text-emerald-700 font-black rounded-2xl transition-all active:scale-95 shadow-xl"
              >
                Get Started — It's Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-800/50 py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-white">
              Kosi <span className="text-emerald-400">Bills</span>
            </span>
          </div>
          <p className="text-slate-600 text-sm text-center">
            © {new Date().getFullYear()} Kosi Bills. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <button className="hover:text-emerald-400 transition-colors">Privacy</button>
            <button className="hover:text-emerald-400 transition-colors">Terms</button>
            <button className="hover:text-emerald-400 transition-colors">Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
