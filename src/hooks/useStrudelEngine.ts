import { useState } from 'react';
import { initStrudel } from '@strudel/web';
import { setBridgeInitializer } from '../utils/patchSuperdough';

/**
 * Return type for useStrudelEngine hook
 */
export interface UseStrudelEngineReturn {
  /** Whether the audio engine is fully initialized and ready */
  engineInitialized: boolean;
  /** Whether initialization is currently in progress */
  isInitializing: boolean;
  /** Whether Hydra audio bridge is connected */
  hydraLinked: boolean;
  /** Current Hydra connection status string for display */
  hydraStatus: string;
  /** Error message from last failed initialization, or null if no error */
  initError: string | null;
  /** Initialize the audio engine (idempotent - safe to call multiple times) */
  startEngine: () => Promise<void>;
  /** Play a test pattern to verify audio is working */
  playTestPattern: () => void;
  /** Stop all audio playback */
  hushAudio: () => void;
  /** Reset error state to allow retry after failed initialization */
  resetError: () => void;
}

/**
 * Hook for managing Strudel audio engine initialization and lifecycle.
 * Handles engine initialization, Hydra audio bridge connection, and playback controls.
 *
 * @remarks
 * This hook manages global state via window.repl and window.replAudio.
 * The audio bridge callback is registered globally via setBridgeInitializer.
 *
 * @returns Object containing engine state and control functions
 */
export function useStrudelEngine(): UseStrudelEngineReturn {
  const [engineInitialized, setEngineInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hydraLinked, setHydraLinked] = useState(false);
  const [hydraStatus, setHydraStatus] = useState('none');
  const [initError, setInitError] = useState<string | null>(null);

  /**
   * Initialize the Strudel audio engine and register audio bridge callback.
   * Prevents duplicate initialization attempts.
   */
  const startEngine = async () => {
    if (engineInitialized || isInitializing) return;

    setIsInitializing(true);
    setInitError(null);

    try {
      // Register bridge initializer callback (invoked when audio first connects)
      setBridgeInitializer((audioContext) => {
        setHydraLinked(true);
        setHydraStatus('Strudel (a.fft)');
        window.replAudio = audioContext;
      });

      // Initialize Strudel (audio bridge created on first connection)
      const repl = await initStrudel({
        prebake: () => window.samples?.('github:tidalcycles/dirt-samples')
      });

      window.repl = repl;
      setEngineInitialized(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setInitError(errorMessage);
      console.error('Failed to initialize Strudel engine:', error);
      // TODO: Replace alert with toast notification in Phase 3
      alert('Failed to initialize audio engine. Check console for details.');
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Play a test pattern (bass drum) to verify audio engine is working.
   * Does nothing if engine is not initialized.
   */
  const playTestPattern = () => {
    if (!window.repl?.evaluate) return;
    window.repl.evaluate('s("bd*4").gain(0.8)');
  };

  /**
   * Stop all audio playback.
   * Does nothing if engine is not initialized.
   */
  const hushAudio = () => {
    window.repl?.stop?.();
  };

  /**
   * Reset error state to allow retry after failed initialization.
   * Call this before retrying startEngine after an error.
   */
  const resetError = () => {
    setInitError(null);
  };

  return {
    engineInitialized,
    isInitializing,
    hydraLinked,
    hydraStatus,
    initError,
    startEngine,
    playTestPattern,
    hushAudio,
    resetError,
  };
}
