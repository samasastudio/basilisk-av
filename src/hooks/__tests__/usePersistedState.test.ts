import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { usePersistedState } from '../usePersistedState';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('usePersistedState', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('returns initial value when no stored value exists', () => {
    const { result } = renderHook(() => usePersistedState('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns stored value when it exists in localStorage', () => {
    localStorageMock.setItem('test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => usePersistedState('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('persists value to localStorage when set', () => {
    const { result } = renderHook(() => usePersistedState('test-key', 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(JSON.parse(localStorageMock.getItem('test-key') ?? '')).toBe('new-value');
  });

  it('supports functional updates like useState', () => {
    const { result } = renderHook(() => usePersistedState('counter', 0));
    const increment = (n: number) => (prev: number) => prev + n;

    act(() => {
      result.current[1](increment(1));
    });
    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1](increment(10));
    });
    expect(result.current[0]).toBe(11);
  });

  it('works with complex objects', () => {
    const initialValue = { x: 100, y: 200 };
    const { result } = renderHook(() => usePersistedState('position', initialValue));

    expect(result.current[0]).toEqual({ x: 100, y: 200 });

    act(() => {
      result.current[1]({ x: 300, y: 400 });
    });

    expect(result.current[0]).toEqual({ x: 300, y: 400 });
    expect(JSON.parse(localStorageMock.getItem('position') ?? '')).toEqual({ x: 300, y: 400 });
  });

  it('handles malformed JSON in localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValueOnce('not-valid-json');
    const { result } = renderHook(() => usePersistedState('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('handles localStorage.setItem errors gracefully', () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => usePersistedState('test-key', 'initial'));

    // Should not throw even when localStorage.setItem fails on initial render
    expect(result.current[0]).toBe('initial');
  });

  it('uses different keys independently', () => {
    const { result: result1 } = renderHook(() => usePersistedState('key1', 'value1'));
    const { result: result2 } = renderHook(() => usePersistedState('key2', 'value2'));

    act(() => {
      result1.current[1]('updated1');
    });

    expect(result1.current[0]).toBe('updated1');
    expect(result2.current[0]).toBe('value2');
  });
});
