/**
 * React hook for previewing Strudel samples
 */

import { useState, useCallback } from 'react';

import * as StrudelEngine from '../services/strudelEngine';

/** Duration in milliseconds to show playing state after preview */
const PREVIEW_PLAYING_DURATION = 1500;

export interface UseSoundPreviewReturn {
  /** Preview a sample by category and index */
  previewSample: (categoryName: string, index?: number) => void;
  /** Stop the current preview */
  stopPreview: () => void;
  /** Whether a preview is currently playing */
  isPlaying: boolean;
  /** Currently playing sample (format: "category:index") */
  currentSample: string | null;
  /** Whether preview is available (engine ready) */
  canPreview: boolean;
}

/**
 * Hook for previewing Strudel samples
 *
 * Uses Strudel's evaluate() to play a single sample with .cut()
 * Stops any currently playing pattern before previewing.
 *
 * @param engineReady - Whether the Strudel engine is initialized and ready
 *
 * @example
 * const { previewSample, stopPreview, isPlaying, canPreview } = useSoundPreview(engineReady);
 *
 * <button onClick={() => previewSample('808', 0)} disabled={!canPreview}>
 *   Preview 808 kick
 * </button>
 */
export const useSoundPreview = (engineReady: boolean): UseSoundPreviewReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSample, setCurrentSample] = useState<string | null>(null);

  const previewSample = useCallback((categoryName: string, index: number = 0): void => {
    // Check if engine is ready first
    if (!engineReady) {
      console.warn('Cannot preview: engine not ready');
      return;
    }

    const repl = StrudelEngine.getReplInstance();

    if (!repl?.evaluate) {
      console.warn('Cannot preview: REPL not available');
      return;
    }

    // Stop any currently playing patterns
    StrudelEngine.hushAudio();

    // Format: s("category:index").gain(0.8).cut(1)
    // .cut(1) prevents overlapping samples in the same cutgroup
    const pattern = `s("${categoryName}:${index}").gain(0.8).cut(1)`;
    const sampleKey = `${categoryName}:${index}`;

    try {
      repl.evaluate(pattern);
      setCurrentSample(sampleKey);
      setIsPlaying(true);

      // Auto-clear playing state after ~1.5 seconds
      // This is a UX approximation since we don't know exact sample duration
      setTimeout(() => {
        setIsPlaying(false);
        setCurrentSample(null);
      }, PREVIEW_PLAYING_DURATION);
    } catch (error) {
      console.error('Preview failed:', error);
      setIsPlaying(false);
      setCurrentSample(null);
    }
  }, [engineReady]);

  const stopPreview = useCallback((): void => {
    StrudelEngine.hushAudio();
    setIsPlaying(false);
    setCurrentSample(null);
  }, []);

  return {
    previewSample,
    stopPreview,
    isPlaying,
    currentSample,
    canPreview: engineReady
  };
};
