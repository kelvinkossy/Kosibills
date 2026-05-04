/**
 * Haptic feedback utility for iOS-like tactile responses
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export const haptics = {
  /**
   * Trigger a light haptic feedback
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Trigger a medium haptic feedback
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Trigger a heavy haptic feedback
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
  },

  /**
   * Trigger a success haptic pattern
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Trigger a warning haptic pattern
   */
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 30, 20]);
    }
  },

  /**
   * Trigger an error haptic pattern
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30, 20, 30]);
    }
  },

  /**
   * Trigger a selection haptic (for UI interactions)
   */
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  },

  /**
   * Generic haptic trigger based on type
   */
  trigger: (type: HapticType) => {
    haptics[type]();
  }
};
