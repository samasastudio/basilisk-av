import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useREPLVisibility } from '../useREPLVisibility';

describe('useREPLVisibility', () => {
  const STORAGE_KEY = 'basilisk-repl-visible';

  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to visible (true) when no stored value', () => {
    const { result } = renderHook(() => useREPLVisibility());
    expect(result.current.isVisible).toBe(true);
  });

  it('loads stored value from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'false');

    const { result } = renderHook(() => useREPLVisibility());
    expect(result.current.isVisible).toBe(false);
  });

  it('setVisible updates the value', () => {
    const { result } = renderHook(() => useREPLVisibility());

    act(() => {
      result.current.setVisible(false);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('setVisible persists to localStorage', () => {
    const { result } = renderHook(() => useREPLVisibility());

    act(() => {
      result.current.setVisible(false);
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('toggleVisible toggles from true to false', () => {
    const { result } = renderHook(() => useREPLVisibility());

    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.toggleVisible();
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('toggleVisible toggles from false to true', () => {
    localStorage.setItem(STORAGE_KEY, 'false');

    const { result } = renderHook(() => useREPLVisibility());

    expect(result.current.isVisible).toBe(false);

    act(() => {
      result.current.toggleVisible();
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('toggleVisible persists changes to localStorage', () => {
    const { result } = renderHook(() => useREPLVisibility());

    act(() => {
      result.current.toggleVisible();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');

    act(() => {
      result.current.toggleVisible();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });
});
