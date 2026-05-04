import { useRef, useEffect, ReactNode } from 'react';
import { motion, PanInfo } from 'motion/react';

interface BackGestureProps {
  children: ReactNode;
  onBack: () => void;
  threshold?: number;
  enabled?: boolean;
}

export default function BackGesture({
  children,
  onBack,
  threshold = 100,
  enabled = true
}: BackGestureProps) {
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleDragStart = () => {
    startX.current = 0;
    currentX.current = 0;
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (!enabled) return;
    
    // Only allow swipe from left edge
    if (info.point.x < 50) {
      currentX.current = info.offset.x;
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!enabled) return;
    
    // Check if swipe from left edge exceeds threshold
    if (info.point.x < 50 && info.offset.x > threshold) {
      onBack();
    }
    
    startX.current = 0;
    currentX.current = 0;
  };

  return (
    <motion.div
      drag={enabled ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        touchAction: 'pan-y',
      }}
    >
      {children}
    </motion.div>
  );
}
