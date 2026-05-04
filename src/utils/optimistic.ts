/**
 * Optimistic UI update utility for instant feedback
 */

interface OptimisticAction<T> {
  optimisticValue: T;
  action: () => Promise<T>;
  onSuccess?: (value: T) => void;
  onError?: (error: Error) => void;
  onSettle?: () => void;
}

export async function optimisticUpdate<T>({
  optimisticValue,
  action,
  onSuccess,
  onError,
  onSettle
}: OptimisticAction<T>): Promise<T> {
  try {
    const result = await action();
    onSuccess?.(result);
    return result;
  } catch (error) {
    onError?.(error as Error);
    throw error;
  } finally {
    onSettle?.();
  }
}

/**
 * Hook-like pattern for optimistic updates in components
 */
export function createOptimisticState<T>(
  initialValue: T,
  setState: (value: T) => void
) {
  return {
    updateOptimistically: async (
      optimisticValue: T,
      action: () => Promise<T>,
      onError?: (error: Error) => void
    ) => {
      const previousValue = initialValue;
      setState(optimisticValue);
      
      try {
        const result = await action();
        return result;
      } catch (error) {
        setState(previousValue);
        onError?.(error as Error);
        throw error;
      }
    }
  };
}
