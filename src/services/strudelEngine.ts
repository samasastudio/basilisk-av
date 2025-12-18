import { initStrudel } from '@strudel/web';

/**
 * Widget configuration from Strudel transpiler
 */
export interface WidgetConfig {
  type: 'slider' | '_scope' | '_pianoroll' | '_punchcard' | '_spiral';
  from: number;
  to: number;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  index?: number;
}

/**
 * Strudel state with widget information
 */
export interface StrudelState {
  widgets: WidgetConfig[];
  miniLocations: unknown[];
  code: string;
  activeCode: string;
  started: boolean;
  pending: boolean;
  error?: Error;
}

/**
 * Strudel REPL instance type
 */
export interface StrudelRepl {
  evaluate: (code: string) => void;
  stop: () => void;
}

/**
 * Callback type for widget updates
 */
export type WidgetUpdateCallback = (widgets: WidgetConfig[]) => void;

/**
 * Widget store for useSyncExternalStore pattern.
 * Provides subscribe/getSnapshot interface for React subscriptions.
 */
type WidgetListener = () => void;
let currentWidgets: WidgetConfig[] = [];
const listeners = new Set<WidgetListener>();

export const widgetStore = {
  /**
   * Get current widget snapshot (for useSyncExternalStore)
   */
  getSnapshot: (): WidgetConfig[] => currentWidgets,

  /**
   * Subscribe to widget changes (for useSyncExternalStore)
   */
  subscribe: (listener: WidgetListener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /**
   * Update widgets and notify all listeners
   */
  setWidgets: (widgets: WidgetConfig[]): void => {
    currentWidgets = widgets;
    listeners.forEach(listener => listener());
  }
};

/**
 * Initialize the Strudel audio engine with default configuration.
 * Loads the Dirt Samples library for drum patterns.
 * Supports widget callbacks for slider/visualization integration.
 *
 * @returns Promise resolving to the initialized REPL instance
 * @throws Error if initialization fails (network, audio context, etc.)
 */
export const initializeStrudel = async (): Promise<StrudelRepl> => {
  const repl = await initStrudel({
    prebake: () => window.samples?.('github:tidalcycles/dirt-samples'),
    onUpdateState: (state: StrudelState) => {
      // Update widget store when widgets change
      if (state.widgets?.length > 0) {
        widgetStore.setWidgets(state.widgets);
      }
    }
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
