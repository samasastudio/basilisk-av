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
}

/**
 * Hook for previewing Strudel samples
 *
 * Uses Strudel's evaluate() to play a single sample with .once()
 * Stops any currently playing pattern before previewing.
 *
 * @example
 * const { previewSample, stopPreview, isPlaying } = useSoundPreview();
 *
 * <button onClick={() => previewSample('808', 0)}>
 *   Preview 808 kick
 * </button>
 */
export const useSoundPreview = (): UseSoundPreviewReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSample, setCurrentSample] = useState<string | null>(null);

  const previewSample = useCallback((categoryName: string, index: number = 0): void => {
    const repl = StrudelEngine.getReplInstance();

    if (!repl?.evaluate) {
      console.warn('Cannot preview: engine not ready');
      return;
    }

    // Stop any currently playing patterns
    StrudelEngine.hushAudio();

    // Format: s("category:index").gain(0.8).once()
    // .once() ensures it plays exactly once without looping
    const pattern = `s("${categoryName}:${index}").gain(0.8).once()`;
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
  }, []);

  const stopPreview = useCallback((): void => {
    StrudelEngine.hushAudio();
    setIsPlaying(false);
    setCurrentSample(null);
  }, []);

  return {
    previewSample,
    stopPreview,
    isPlaying,
    currentSample
  };
};
