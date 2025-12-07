/**
 * React hook for previewing Strudel samples
 */

import { useState, useCallback, useRef } from 'react';

import * as StrudelEngine from '../services/strudelEngine';

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
 * Uses Strudel's evaluate() to play a sample pattern.
 * Each new preview replaces the previous one.
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewSample = useCallback((categoryName: string, index: number = 0): void => {
    const repl = StrudelEngine.getReplInstance();

    if (!repl?.evaluate) {
      console.warn('Cannot preview: engine not ready');
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Play the sample - just evaluate the pattern directly
    // Don't call hushAudio() first as that stops the engine
    // The new pattern will replace any currently playing pattern
    const pattern = `s("${categoryName}:${index}").gain(0.8)`;
    const sampleKey = `${categoryName}:${index}`;

    try {
      repl.evaluate(pattern);
      setCurrentSample(sampleKey);
      setIsPlaying(true);

      // Auto-clear playing state after ~2 seconds
      timeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        setCurrentSample(null);
      }, 2000);
    } catch (error) {
      console.error('Preview failed:', error);
      setIsPlaying(false);
      setCurrentSample(null);
    }
  }, []);

  const stopPreview = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
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
