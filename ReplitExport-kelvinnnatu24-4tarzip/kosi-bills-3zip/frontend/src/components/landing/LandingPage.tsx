import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import {
  Zap, Shield, Star, ChevronRight, Phone, Wifi, Lightbulb, Tv,
  Gift, ArrowRight, CheckCircle, Smartphone, Globe, Menu, X,
  Clock, RefreshCw, Headphones, TrendingUp, Users, Lock,
} from 'lucide-react';
import Logo from '../common/Logo';
import heroGirl from '../../assets/hero-girl.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const services = [
  { icon: Phone,     label: 'Airtime',      desc: 'MTN, Airtel, Glo, 9mobile — top up in 3 seconds flat.',         color: 'from-blue-500 to-blue-600',     glow: 'rgba(59,130,246,0.15)' },
  { icon: Wifi,      label: 'Data Bundles', desc: 'Affordable daily, weekly and monthly data for all networks.',      color: 'from-purple-500 to-purple-600', glow: 'rgba(168,85,247,0.15)' },
  { icon: Lightbulb, label: 'Electricity',  desc: 'NEPA tokens and postpaid bills for any meter nationwide.',         color: 'from-yellow-500 to-orange-500', glow: 'rgba(234,179,8,0.15)' },
  { icon: Tv,        label: 'Cable TV',     desc: 'DStv, GOtv, Startimes & Showmax renewed without the stress.',     color: 'from-red-500 to-pink-500',      glow: 'rgba(239,68,68,0.15)' },
  { icon: Globe,     label: 'Internet',     desc: 'Spectranet, Smile, ipNX and more — fast broadband payments.',     color: 'from-cyan-500 to-teal-500',     glow: 'rgba(6,182,212,0.15)' },
  { icon: Gift,      label: 'Earn Rewards', desc: 'Cashback points on every payment — the more you pay, you save.', color: 'from-emerald-500 to-green-600',  glow: 'rgba(16,185,129,0.15)' },
];

const features = [
  { icon: Zap,        title: 'Lightning Fast',    desc: 'Transactions in under 10 seconds. Pay at the last minute and still make it.' },
  { icon: Shield,     title: 'Bank-Grade Security', desc: '256-bit encryption, PIN protection and 2FA on every account.' },
  { icon: Clock,      title: 'Always Online',     desc: 'Midnight or midday — no downtime, no maintenance windows.' },
  { icon: Smartphone, title: 'All Your Devices',  desc: 'Phone, tablet, laptop. Your wallet syncs instantly across all of them.' },
  { icon: RefreshCw,  title: 'Repeat in 2 Taps',  desc: 'Your history remembers every bill. Repeat any payment without re-entering details.' },
  { icon: Headphones, title: 'Real Support',      desc: 'Raise a ticket from the app. A real human tracks and resolves your issue.' },
];

const steps = [
  { num: '01', title: 'Create Your Account', desc: 'Sign up with email and phone in under 2 minutes. No paperwork, no branch visits.' },
  { num: '02', title: 'Fund Your Wallet',    desc: 'Add money via card or bank transfer. Instant and secure.' },
  { num: '03', title: 'Pay Any Bill',        desc: 'Pick the service, enter the details, confirm. Done before you put your phone down.' },
];

const stats = [
  { value: '500K+', label: 'Transactions Processed', icon: TrendingUp },
  { value: '50K+',  label: 'Happy Users',             icon: Users },
  { value: '99.9%', label: 'Uptime Guaranteed',       icon: Zap },
  { value: '0 ₦',   label: 'Hidden Fees',             icon: Lock },
];

const HEADLINE_WORDS = ['Stop', 'Stressing', 'About', 'Bills.'];

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroImageY = useTransform(scrollY, [0, 500], [0, 60]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030f08] text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 transition-all duration-500 ${scrolled ? 'bg-[#030f08]/90 backdrop-blur-xl shadow-xl shadow-black/40 border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Animated logo */}
          <motion.div
            initial={{ opacity: 0, x: -24, rotate: -8 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.7, type: 'spring', stiffness: 200, damping: 18 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Logo className="w-9 h-9" />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-white">
              Kosi <span className="text-emerald-400">Bills</span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, type: 'spring', stiffness: 200, damping: 18 }}
            className="hidden sm:flex items-center gap-3"
          >
            <button onClick={onLogin}
              className="px-5 py-2.5 text-sm font-semibold text-emerald-300 hover:text-white transition-colors">
              Sign In
            </button>
            <button onClick={onGetStarted}
              className="px-5 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/30">
              Get Started Free
            </button>
          </motion.div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-400 hover:text-white transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="sm:hidden mt-3 overflow-hidden">
              <div className="bg-[#041a0c] border border-emerald-900/40 rounded-2xl p-4 flex flex-col gap-3">
                <button onClick={() => { setMobileMenuOpen(false); onLogin(); }} className="w-full py-3 text-sm font-semibold text-emerald-300 hover:text-white text-center">Sign In</button>
                <button onClick={() => { setMobileMenuOpen(false); onGetStarted(); }} className="w-full py-3 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl">Get Started Free</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center px-4 sm:px-8 pt-24 pb-10 overflow-hidden">

        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated radial glow */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.12, 0.18, 0.12] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500 rounded-full blur-[120px]"
          />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-700/10 rounded-full blur-[80px]" />
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,78,59,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,78,59,0.06)_1px,transparent_1px)] bg-[size:60px_60px]" />
          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#030f08_100%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-6 items-center">

            {/* Left: Copy */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.6, type: 'spring', stiffness: 150 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-6"
              >
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                />
                Nigeria's Trusted Bill Payment Platform
              </motion.div>

              {/* Animated headline words */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-3">
                {HEADLINE_WORDS.map((word, i) => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-block mr-3"
                  >
                    {word}
                  </motion.span>
                ))}
                <br />
                <motion.span
                  initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400"
                >
                  Just Pay.
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8 max-w-lg"
              >
                Airtime, data, electricity, cable TV, internet — all in one place.
                Every payment earns you reward points. The more you pay, the more you save.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
              >
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <motion.button
                    onClick={onGetStarted}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex items-center justify-center gap-2 px-7 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/30 overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <span className="relative">Create Free Account</span>
                    <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </motion.button>

                  <motion.button
                    onClick={onLogin}
                    whileHover={{ scale: 1.02, borderColor: 'rgba(52,211,153,0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-7 py-4 border border-slate-700 text-slate-300 hover:text-white font-semibold rounded-2xl transition-colors duration-200"
                  >
                    Sign In <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  {['Free to join', 'No hidden fees', 'Instant payments'].map((txt, i) => (
                    <motion.span
                      key={txt}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.75 + i * 0.08 }}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> {txt}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right: Hero image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="relative">
                {/* Glow behind image */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.28, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-90 translate-y-8"
                />

                {/* Hero image with subtle float */}
                <motion.div style={{ y: heroImageY }}>
                  <motion.img
                    src={heroGirl}
                    alt="Happy Kosi Bills user"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative z-10 w-full max-w-xs sm:max-w-sm lg:max-w-md rounded-3xl object-cover shadow-2xl shadow-black/50"
                    style={{ maxHeight: '540px', objectPosition: 'top' }}
                  />
                </motion.div>

                {/* Floating card: Payment success */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: [0, -6, 0] }}
                  transition={{
                    opacity: { delay: 0.7, duration: 0.5 },
                    scale: { delay: 0.7, duration: 0.5, type: 'spring' },
                    x: { delay: 0.7 },
                    y: { delay: 1.2, duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className="absolute top-8 -left-4 sm:-left-10 z-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-2xl"
                >
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-xs font-bold text-white">Payment Successful</p>
                      <p className="text-[10px] text-slate-300">Electricity • ₦5,000</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card: Rewards */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: [0, 6, 0] }}
                  transition={{
                    opacity: { delay: 0.9, duration: 0.5 },
                    scale: { delay: 0.9, duration: 0.5, type: 'spring' },
                    x: { delay: 0.9 },
                    y: { delay: 1.5, duration: 4, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className="absolute bottom-16 -right-4 sm:-right-8 z-20 bg-[#041a0c]/90 backdrop-blur-xl border border-emerald-700/40 rounded-2xl px-4 py-3 shadow-xl"
                >
                  <p className="text-[10px] text-slate-400 font-medium mb-1">Rewards Earned</p>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                    <p className="text-sm font-black text-white">+50 pts</p>
                  </div>
                </motion.div>

                {/* Floating card: Users online */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: [0, -4, 0] }}
                  transition={{
                    opacity: { delay: 1.1, duration: 0.5 },
                    y: { delay: 1.8, duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className="absolute top-1/2 -right-2 sm:-right-6 z-20 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl px-3 py-2 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {['bg-blue-400', 'bg-purple-400', 'bg-pink-400'].map((c, i) => (
                        <div key={i} className={`w-5 h-5 rounded-full ${c} border border-white/20`} />
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white leading-none">50K+ users</p>
                      <p className="text-[9px] text-emerald-400">online now</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 2 }, y: { delay: 2, duration: 1.8, repeat: Infinity } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <div className="w-px h-8 bg-gradient-to-b from-emerald-400/60 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
        </motion.div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-10 px-4 sm:px-8 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="text-center"
            >
              <div className="flex justify-center mb-2">
                <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-emerald-400 font-semibold text-xs tracking-widest uppercase mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Get Started in 3 Easy Steps</h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative group"
              >
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(100%-8px)] w-full h-px border-t border-dashed border-emerald-900/50 z-0" />
                )}
                <div className="relative z-10 bg-[#041a0c]/60 border border-emerald-900/30 group-hover:border-emerald-700/50 rounded-3xl p-6 transition-colors duration-300 h-full">
                  <motion.span
                    animate={{ opacity: [0.25, 0.4, 0.25] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                    className="text-4xl font-black text-emerald-500 mb-4 block"
                  >
                    {step.num}
                  </motion.span>
                  <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-24 px-4 sm:px-8 bg-[#020c05]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-emerald-400 font-semibold text-xs tracking-widest uppercase mb-3">Everything You Need</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">One App. All Your Bills.</h2>
            <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm">
              Stop switching between apps. Kosi Bills brings every essential payment into one clean, fast experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {services.map(({ icon: Icon, label, desc, color, glow }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                className="group relative bg-[#041a0c]/50 border border-emerald-900/30 hover:border-emerald-700/50 rounded-3xl p-5 sm:p-6 transition-colors duration-300 cursor-default overflow-hidden"
                style={{ '--glow': glow } as any}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${glow}, transparent 70%)` }}
                />
                <div className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="relative font-bold text-white text-sm sm:text-base mb-1.5">{label}</h3>
                <p className="relative text-slate-500 text-xs sm:text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-emerald-400 font-semibold text-xs tracking-widest uppercase mb-3">Built Different</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Why People Choose{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">Kosi Bills</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm">
              Built from the ground up to solve real problems — slow payments, hidden charges, poor support.
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
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="flex gap-4 p-5 bg-[#041a0c]/60 border border-emerald-900/30 hover:border-emerald-700/40 rounded-3xl transition-colors duration-300 group"
              >
                <div className="flex-shrink-0 w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors duration-300">
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

      {/* ── CTA ── */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[2rem] p-10 sm:p-14 text-center shadow-2xl shadow-emerald-900/40"
          >
            {/* Animated gradient background */}
            <motion.div
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #059669, #0d9488, #047857, #0f766e, #059669)',
                backgroundSize: '300% 300%',
              }}
            />
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-black/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex mb-5"
              >
                <Logo className="w-14 h-14 drop-shadow-2xl" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
                Your Bills Won't Pay Themselves.
              </h2>
              <p className="text-emerald-100/80 max-w-xl mx-auto mb-8 leading-relaxed text-sm sm:text-base">
                Create your free Kosi Bills account today and experience the easiest way to pay all your bills — fast, secure, and rewarding.
              </p>
              <motion.button
                onClick={onGetStarted}
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-3 px-9 py-4 bg-white text-emerald-700 font-black rounded-2xl shadow-xl transition-colors hover:bg-slate-50"
              >
                Get Started — It's Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/50 py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-3"
          >
            <Logo className="w-8 h-8" />
            <span className="font-bold text-white">Kosi <span className="text-emerald-400">Bills</span></span>
          </motion.div>
          <p className="text-slate-600 text-sm text-center">© {new Date().getFullYear()} Kosi Bills. All rights reserved.</p>
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
