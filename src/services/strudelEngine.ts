/* eslint-disable no-console, func-style, @typescript-eslint/no-explicit-any, @typescript-eslint/prefer-nullish-coalescing */
// Console logging is essential for debugging Strudel engine initialization
// func-style and any types required for Strudel API compatibility
import { initStrudel, registerWidgetType } from '@strudel/web';

import { getBridgeInstance } from './audioBridge';
import { visualizationManager } from './visualizationManager';

/** Retry interval in milliseconds for audio analyser connection */
const AUDIO_ANALYSER_RETRY_INTERVAL_MS = 100;

/**
 * Widget configuration from Strudel transpiler
 */
export interface WidgetConfig {
  type: 'slider' | '_scope' | '_pianoroll' | '_punchcard' | '_spiral' | '_spectrum';
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
  evaluate?: (code: string) => void;
  stop?: () => void;
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
  // Register widget types with transpiler BEFORE initializing REPL
  // This ensures the REPL's transpiler instance recognizes these widget methods
  console.log('[initializeStrudel] Registering widget types before REPL init');
  registerWidgetType('_scope');
  registerWidgetType('_pianoroll');
  registerWidgetType('_punchcard');
  registerWidgetType('_spiral');
  registerWidgetType('_spectrum');
  console.log('[initializeStrudel] Widget types registered');

  const repl = await initStrudel({
    prebake: () => window.samples?.('github:tidalcycles/dirt-samples'),
    onUpdateState: (state: StrudelState) => {
      // Always update widget store, including empty arrays for cleanup
      widgetStore.setWidgets(state.widgets || []);

      // Update visualization manager playback state
      visualizationManager.setPlaybackState(state.started);
    }
  });

  // Connect visualization manager to REPL
  connectVisualizationManager(repl);

  return repl;
};

/**
 * Connect the visualization manager to the Strudel REPL.
 * Sets up pattern and time getters.
 */
function connectVisualizationManager(_repl: StrudelRepl): void {
  console.log('[connectVisualizationManager] Connecting visualization manager to REPL');

  // Set pattern getter - accesses the current pattern from window.repl
  visualizationManager.setPatternGetter(() => {
    // The pattern is stored in window.repl.pattern or window.repl.scheduler.pattern
    const pattern = (window.repl as any)?.scheduler?.pattern || (window.repl as any)?.pattern;
    return pattern;
  });

  // Set time getter - accesses current playback time from scheduler
  visualizationManager.setTimeGetter(() => {
    // The scheduler has a now() method that returns current time
    const scheduler = (window.repl as any)?.scheduler;
    if (scheduler?.now) {
      return scheduler.now();
    }
    return 0;
  });

  console.log('[connectVisualizationManager] Pattern and time getters connected');
}

/**
 * Connect the audio analyser to the visualization manager.
 * Should be called after the audio bridge is initialized.
 */
export const connectAudioAnalyser = (): void => {
  console.log('[connectAudioAnalyser] Attempting to connect audio analyser');

  const bridge = getBridgeInstance();
  if (bridge?.analyser) {
    visualizationManager.setAudioAnalyser(bridge.analyser);
    console.log('[connectAudioAnalyser] Audio analyser connected successfully');
  } else {
    console.warn('[connectAudioAnalyser] No audio bridge found - retrying in 100ms');
    // Retry after a short delay in case bridge is still initializing
    setTimeout(() => {
      const retryBridge = getBridgeInstance();
      if (retryBridge?.analyser) {
        visualizationManager.setAudioAnalyser(retryBridge.analyser);
        console.log('[connectAudioAnalyser] Audio analyser connected on retry');
      } else {
        console.error('[connectAudioAnalyser] Failed to connect audio analyser - scope/spectrum will not work');
      }
    }, AUDIO_ANALYSER_RETRY_INTERVAL_MS);
  }
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
