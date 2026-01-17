import { useSyncExternalStore } from 'react';

import { getBridgeFFT } from '../services/audioBridge';
import '../types/hydra';

/**
 * No-op subscribe function for when HUD is disabled.
 * Returns an empty cleanup function.
 */
const noopSubscribe = (): (() => void) => () => {};

/**
 * Returns 0 when HUD is disabled.
 */
const getEmptySnapshot = (): number => 0;

/**
 * Hook for managing the Hydra HUD (Heads-Up Display).
 * Subscribes to window.a.fft[0] updates via requestAnimationFrame.
 *
 * @param enabled - Whether the HUD subscription is active (default: true)
 * @returns Object containing the current HUD value (0-1 range)
 */
export const useHydraHUD = (enabled: boolean = true): { hudValue: number } => {
  const hudValue = useSyncExternalStore(
    enabled ? subscribe : noopSubscribe,
    enabled ? getSnapshot : getEmptySnapshot,
    getServerSnapshot
  );

  return { hudValue };
}

/**
 * Subscribe to FFT updates via requestAnimationFrame.
 *
 * Implements change detection to avoid unnecessary React re-renders
 * when the FFT value hasn't actually changed.
 */
const subscribe = (onStoreChange: () => void): (() => void) => {
  let frameId: number | null = null;
  let lastValue: number | null = null;

  const updateHud = (): void => {
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
 * Get current FFT value from audio bridge
 */
const getSnapshot = (): number => getBridgeFFT(0);

/**
 * Server-side snapshot (always 0)
 */
const getServerSnapshot = (): number => 0;
