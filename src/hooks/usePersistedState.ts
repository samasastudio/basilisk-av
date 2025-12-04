import { useState, useEffect, useCallback } from 'react';

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
  // Get initial value from localStorage or use default
  const getStoredValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Update localStorage when value changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Silently fail if localStorage is full or unavailable
    }
  }, [key, storedValue]);

  // Setter that supports functional updates like useState
  const setValue = useCallback((value: T | ((prev: T) => T)): void => {
    setStoredValue((prev) => {
      const nextValue = value instanceof Function ? value(prev) : value;
      return nextValue;
    });
  }, []);

  return [storedValue, setValue];
};
