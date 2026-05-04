import { useRef, useEffect, ReactNode } from 'react';
import { motion, PanInfo } from 'motion/react';

interface SwipeGestureProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  swipeThreshold?: number;
  className?: string;
}

export default function SwipeGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = 50,
  className = ''
}: SwipeGestureProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset;
    const velocity = info.velocity;

    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      if (offset.x > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    if (Math.abs(offset.y) > swipeThreshold || Math.abs(velocity.y) > 500) {
      if (offset.y > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
  };

  return (
    <motion.div
      ref={constraintsRef}
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className={className}
      style={{ touchAction: 'none' }}
    >
      {children}
    </motion.div>
  );
}
