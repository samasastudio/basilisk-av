import { initStrudel } from '@strudel/web';

/**
 * Strudel REPL instance type
 */
export interface StrudelRepl {
  evaluate: (code: string) => void;
  stop: () => void;
}

/**
 * Initialize the Strudel audio engine with default configuration.
 * Loads the Dirt Samples library for drum patterns.
 *
 * @returns Promise resolving to the initialized REPL instance
 * @throws Error if initialization fails (network, audio context, etc.)
 */
export const initializeStrudel = async (): Promise<StrudelRepl> => {
  const repl = await initStrudel({
    prebake: () => window.samples?.('github:tidalcycles/dirt-samples')
  });
  return repl;
};

/**
 * Play a test pattern (4 bass drums) to verify audio is working.
 * Safe to call even if REPL is not ready.
 *
 * @param repl - The Strudel REPL instance (defaults to window.repl)
 * @returns true if pattern was played, false if REPL not ready
 */
export const playTestPattern = (repl?: StrudelRepl): boolean => {
  const replInstance = repl ?? getReplInstance();
  if (!replInstance?.evaluate) return false;
  replInstance.evaluate('s("bd*4").gain(0.8)');
  return true;
};

/**
 * Stop all audio playback (hush).
 * Safe to call even if REPL is not ready.
 *
 * @param repl - The Strudel REPL instance (defaults to window.repl)
 * @returns true if audio was stopped, false if REPL not ready
 */
export const hushAudio = (repl?: StrudelRepl): boolean => {
  const replInstance = repl ?? getReplInstance();
  if (!replInstance?.stop) return false;
  replInstance.stop();
  return true;
};

/**
 * Get the global REPL instance from window.repl.
 * This is the primary way to access the REPL after initialization.
 *
 * @returns The REPL instance or undefined if not initialized
 */
export const getReplInstance = (): StrudelRepl | undefined => window.repl;

/**
 * Get the global AudioContext instance from window.replAudio.
 * Available after the audio bridge is initialized.
 *
 * @returns The AudioContext or undefined if not initialized
 */
export const getAudioContext = (): AudioContext | undefined => window.replAudio;

/**
 * Check if the Strudel engine is fully initialized and ready to use.
 * Verifies that window.repl exists and has required methods.
 *
 * @returns true if engine is ready, false otherwise
 */
export const isEngineReady = (): boolean => Boolean(window.repl?.evaluate && window.repl?.stop);
