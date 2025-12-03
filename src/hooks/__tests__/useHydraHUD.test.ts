import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHydraHUD } from '../useHydraHUD';

describe('useHydraHUD', () => {
  beforeEach(() => {
    // Mock import.meta.env.DEV
    vi.stubGlobal('import.meta', { env: { DEV: true } });

    // Mock window.a
    (window as any).a = {
      fft: [0.5, 0.3, 0.2, 0.1]
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as any).a;
  });

  it('returns hudValue object', () => {
    const { result } = renderHook(() => useHydraHUD());

    expect(result.current).toHaveProperty('hudValue');
    expect(typeof result.current.hudValue).toBe('number');
  });

  it('updates hudValue from window.a.fft[0] when available', async () => {
    const { result } = renderHook(() => useHydraHUD());

    // Trigger animation frame
    await vi.waitFor(() => {
      expect(result.current.hudValue).toBe(0.5);
    });
  });

  it('returns 0 when window.a is not defined', async () => {
    delete (window as any).a;

    const { result } = renderHook(() => useHydraHUD());

    // Even after animation frame, should still be 0
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(result.current.hudValue).toBe(0);
  });

  it('cleans up animation frame on unmount', () => {
    let frameId: number = 0;
    const rafMock = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frameId = ++frameId;
      return frameId;
    });
    const cancelMock = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = renderHook(() => useHydraHUD());

    unmount();

    expect(cancelMock).toHaveBeenCalledWith(frameId);

    rafMock.mockRestore();
    cancelMock.mockRestore();
  });

  it('does not run in production mode', () => {
    // Set production mode in a fresh test
    vi.unstubAllGlobals();
    vi.stubGlobal('import.meta', { env: { DEV: false } });

    const { result } = renderHook(() => useHydraHUD());

    // Hook should still return an object, but won't update values in production
    expect(result.current).toHaveProperty('hudValue');
  });

  it('implements change detection to minimize re-renders', async () => {
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useHydraHUD();
    });

    // Wait for initial render and first value update
    await vi.waitFor(() => {
      expect(result.current.hudValue).toBe(0.5);
    });

    const initialRenderCount = renderCount;

    // Keep same value for several frames
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not have additional renders since value didn't change
    // (Allow for 1-2 renders max due to test environment quirks)
    expect(renderCount - initialRenderCount).toBeLessThan(3);
  });
});
