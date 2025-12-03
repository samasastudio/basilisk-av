import { useSyncExternalStore } from 'react';
import '../types/hydra';

/**
 * Hook for managing the Hydra HUD (Heads-Up Display) in development mode.
 * Subscribes to window.a.fft[0] updates via requestAnimationFrame.
 *
 * Only runs in development mode (import.meta.env.DEV).
 *
 * @returns Object containing the current HUD value (0-1 range)
 */
export function useHydraHUD() {
  const hudValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return { hudValue };
}

/**
 * Subscribe to FFT updates via requestAnimationFrame.
 * Only subscribes in development mode.
 *
 * Implements change detection to avoid unnecessary React re-renders
 * when the FFT value hasn't actually changed.
 */
function subscribe(onStoreChange: () => void): () => void {
  // In production, return no-op unsubscribe
  if (!import.meta.env.DEV) {
    return () => {};
  }

  let frameId: number | null = null;
  let lastValue: number | null = null;

  const updateHud = () => {
    const currentValue = getSnapshot();

    // Only notify React if value actually changed
    if (currentValue !== lastValue) {
      lastValue = currentValue;
      onStoreChange();
    }

    frameId = requestAnimationFrame(updateHud);
  };

  frameId = requestAnimationFrame(updateHud);

  // Return cleanup function
  return () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }
  };
}

/**
 * Get current FFT value from window.a
 */
function getSnapshot(): number {
  return window.a?.fft?.[0] ?? 0;
}

/**
 * Server-side snapshot (always 0)
 */
function getServerSnapshot(): number {
  return 0;
}
