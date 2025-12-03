import { useState } from 'react';
import { initStrudel } from '@strudel/web';
import { setBridgeInitializer } from '../utils/patchSuperdough';

/**
 * Hook for managing Strudel audio engine initialization and lifecycle.
 * Handles engine initialization, Hydra audio bridge connection, and playback controls.
 *
 * @returns Object containing engine state and control functions
 */
export function useStrudelEngine() {
  const [engineInitialized, setEngineInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hydraLinked, setHydraLinked] = useState(false);
  const [hydraStatus, setHydraStatus] = useState('none');

  /**
   * Initialize the Strudel audio engine and register audio bridge callback.
   * Prevents duplicate initialization attempts.
   */
  const startEngine = async () => {
    if (engineInitialized || isInitializing) return;

    setIsInitializing(true);
    try {
      // Register bridge initializer callback (invoked when audio first connects)
      setBridgeInitializer((audioContext) => {
        setHydraLinked(true);
        setHydraStatus('Strudel (a.fft)');
        (window as any).replAudio = audioContext;
      });

      // Initialize Strudel (audio bridge created on first connection)
      const repl = await initStrudel({
        prebake: () => (window as any).samples('github:tidalcycles/dirt-samples')
      });

      (window as any).repl = repl;
      setEngineInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Strudel engine:', error);
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
    const repl = (window as any).repl;
    if (!repl || !repl.evaluate) return;
    repl.evaluate('s("bd*4").gain(0.8)');
  };

  /**
   * Stop all audio playback.
   * Does nothing if engine is not initialized.
   */
  const hushAudio = () => {
    const repl = (window as any).repl;
    if (repl && repl.stop) repl.stop();
  };

  return {
    engineInitialized,
    isInitializing,
    hydraLinked,
    hydraStatus,
    startEngine,
    playTestPattern,
    hushAudio,
  };
}
