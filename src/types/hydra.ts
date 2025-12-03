/**
 * Type definitions for Hydra audio bridge (window.a)
 *
 * The bridge is created by strudelHydraBridge.ts and exposes
 * audio analysis data to Hydra visual synthesis.
 */

export interface HydraBridge {
  /** AnalyserNode for FFT analysis */
  analyser: AnalyserNode;

  /** GainNode for audio routing */
  gainNode: GainNode;

  /** Number of frequency bands (default: 4) */
  bins: number;

  /** Frequency data array (0-1 range, length = bins) */
  fft: number[];

  /** Update FFT data from analyser */
  tick: () => void;

  /** Change number of frequency bands */
  setBins: (n: number) => void;

  /** Disconnect audio nodes */
  disconnect: () => void;
}

/**
 * Strudel REPL instance interface
 * Provides code evaluation and audio control
 */
export interface StrudelRepl {
  /** Evaluate Strudel pattern code */
  evaluate?: (code: string) => void;

  /** Stop all audio playback */
  stop?: () => void;
}

declare global {
  interface Window {
    /** Hydra audio bridge for audio-reactive visuals */
    a?: HydraBridge;

    /** Strudel REPL instance */
    repl?: StrudelRepl;

    /** Strudel audio context (from bridge initialization) */
    replAudio?: AudioContext;

    /** Strudel samples loader */
    samples?: (url: string) => Promise<any>;
  }
}

export {};
