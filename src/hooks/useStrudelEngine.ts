import { useState } from 'react';

import * as StrudelEngine from '../services/strudelEngine';
import { canStartEngine, isEngineInitializing, isEngineReady } from '../types/engine';
import { setBridgeInitializer } from '../utils/patchSuperdough';

import type { EngineStatus } from '../types/engine';

/**
 * Return type for useStrudelEngine hook
 */
export interface UseStrudelEngineReturn {
  /** Current engine status (idle | initializing | ready | error) */
  engineStatus: EngineStatus;
  /** Whether the audio engine is fully initialized and ready (derived from engineStatus) */
  engineInitialized: boolean;
  /** Whether initialization is currently in progress (derived from engineStatus) */
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
export const useStrudelEngine = (): UseStrudelEngineReturn => {
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('idle');
  const [hydraLinked, setHydraLinked] = useState(false);
  const [hydraStatus, setHydraStatus] = useState('none');
  const [initError, setInitError] = useState<string | null>(null);

  // Derived boolean states for backward compatibility
  const engineInitialized = isEngineReady(engineStatus);
  const isInitializing = isEngineInitializing(engineStatus);

  /**
   * Initialize the Strudel audio engine and register audio bridge callback.
   * Prevents duplicate initialization attempts using state machine.
   */
  const startEngine = async (): Promise<void> => {
    if (!canStartEngine(engineStatus)) {return;}

    setEngineStatus('initializing');
    setInitError(null);

    try {
      // Register bridge initializer callback (invoked when audio first connects)
      setBridgeInitializer((audioContext) => {
        setHydraLinked(true);
        setHydraStatus('Strudel (a.fft)');
        window.replAudio = audioContext;

        // Connect audio analyser to visualization manager now that bridge is initialized
        StrudelEngine.connectAudioAnalyser();
      });

      // Initialize Strudel (audio bridge created on first connection)
      const repl = await StrudelEngine.initializeStrudel();

      window.repl = repl;
      setEngineStatus('ready');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setInitError(errorMessage);
      setEngineStatus('error');
      console.error('Failed to initialize Strudel engine:', error);
      // TODO: Replace alert with toast notification in Phase 3
      alert('Failed to initialize audio engine. Check console for details.');
    }
  };

  /**
   * Play a test pattern (bass drum) to verify audio engine is working.
   * Does nothing if engine is not initialized.
   */
  const playTestPattern = (): void => {
    StrudelEngine.playTestPattern();
  };

  /**
   * Stop all audio playback.
   * Does nothing if engine is not initialized.
   */
  const hushAudio = (): void => {
    StrudelEngine.hushAudio();
  };

  /**
   * Reset error state to allow retry after failed initialization.
   * Transitions from 'error' back to 'idle' state.
   */
  const resetError = (): void => {
    setInitError(null);
    if (engineStatus === 'error') {
      setEngineStatus('idle');
    }
  };

  return {
    engineStatus,
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
