import { useState, useCallback } from 'react';

/**
 * Generic hook for persisting state to localStorage.
 * Falls back to in-memory state if localStorage is unavailable.
 *
 * @param key - The localStorage key to use for persistence
 * @param initialValue - The initial value if no stored value exists
 * @returns Tuple of [value, setValue] similar to useState
 */
export const usePersistedState = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  // Lazy initializer - only runs once on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Setter with inline localStorage write (no useEffect needed!)
  const setValue = useCallback((value: T | ((prev: T) => T)): void => {
    setStoredValue((prev) => {
      const nextValue = value instanceof Function ? value(prev) : value;

      // Sync to localStorage immediately during state update
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // Silently fail if localStorage unavailable
        }
      }

      return nextValue;
    });
  }, [key]);

  return [storedValue, setValue];
};
