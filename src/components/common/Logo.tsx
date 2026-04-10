import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  animate?: boolean;
}

export default function Logo({ className = "w-10 h-10", animate = false }: LogoProps) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
        <rect width="100" height="100" rx="28" fill="url(#logo-grad)"/>
        
        {/* K Stem */}
        <path d="M32 26 V74" stroke="white" strokeWidth="12" strokeLinecap="round"/>
        
        {/* K Top Arm */}
        <path d="M32 54 L66 26" stroke="white" strokeWidth="12" strokeLinecap="round"/>
        
        {/* K Bottom Arm */}
        <path d="M44 44 L66 74" stroke="white" strokeWidth="12" strokeLinecap="round"/>
        
        {/* Accent Dot */}
        <circle cx="74" cy="26" r="6" fill="#6EE7B7" />

        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#059669"/>
            <stop offset="1" stopColor="#022C22"/>
          </linearGradient>
        </defs>
      </svg>
      
      {animate && (
        <motion.div 
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '200%', opacity: 0.4 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 0.5 }}
          className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 pointer-events-none"
          style={{ clipPath: 'inset(0 0 0 0 round 28%)' }}
        />
      )}
    </div>
  );
}
