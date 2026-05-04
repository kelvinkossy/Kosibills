import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave';
}

export default function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width = '100%',
  height = '100%',
  animation = 'pulse'
}: SkeletonProps) {
  const getStyles = () => {
    const base = 'bg-slate-200 dark:bg-slate-700';
    
    switch (variant) {
      case 'text':
        return `${base} h-4 rounded`;
      case 'circular':
        return `${base} rounded-full`;
      case 'rectangular':
        return `${base} rounded-lg`;
      case 'rounded':
        return `${base} rounded-xl`;
      default:
        return base;
    }
  };

  return (
    <motion.div
      className={`${getStyles()} ${className}`}
      style={{ width, height }}
      animate={
        animation === 'pulse'
          ? { opacity: [0.6, 1, 0.6] }
          : { x: ['-100%', '100%'] }
      }
      transition={
        animation === 'pulse'
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
      }
    />
  );
}
