import { motion } from 'motion/react';
import { useEffect } from 'react';
import Logo from '../common/Logo';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#021c14] flex items-center justify-center z-50 overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute inset-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-emerald-600/20 blur-[120px]"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-emerald-800/30 blur-[120px]"
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, type: "spring", bounce: 0.4 }}
          className="mb-8"
        >
          <Logo className="w-28 h-28 sm:w-32 sm:h-32 shadow-2xl shadow-emerald-900/50" animate={true} />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl sm:text-5xl font-light text-white tracking-[0.2em] uppercase text-center flex items-center gap-3"
        >
          Kosi <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">Bills</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-4 text-emerald-200/60 tracking-widest text-sm uppercase font-medium"
        >
          Digital Financial Services
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-16 w-48 h-1 bg-emerald-900/50 rounded-full overflow-hidden relative"
        >
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 0.9, ease: "easeInOut" }}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ delay: 0.5, duration: 0.9, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-1/2 h-full bg-white/40 blur-[2px]"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
