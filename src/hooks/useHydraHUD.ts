import { useSyncExternalStore } from 'react';

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
 */
function subscribe(onStoreChange: () => void): () => void {
  // In production, return no-op unsubscribe
  if (!import.meta.env.DEV) {
    return () => {};
  }

  let frameId: number | null = null;

  const updateHud = () => {
    onStoreChange(); // Notify React of changes
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
  return (window as any).a?.fft?.[0] ?? 0;
}

/**
 * Server-side snapshot (always 0)
 */
function getServerSnapshot(): number {
  return 0;
}
