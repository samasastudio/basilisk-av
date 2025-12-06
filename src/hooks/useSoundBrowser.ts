/**
 * Orchestration hook for sound browser state
 */

import { useState, useMemo } from 'react';
import { useSampleData } from './useSampleData';
import { useSoundPreview } from './useSoundPreview';
import { usePersistedState } from './usePersistedState';
import type { SampleCategory } from '../types/samples';

export interface UseSoundBrowserReturn {
  // Visibility
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Data
  categories: SampleCategory[];
  isLoading: boolean;
  error: string | null;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Category selection
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;

  // Preview
  previewSample: (categoryName: string, index: number) => void;
  stopPreview: () => void;
  currentlyPlaying: string | null;
}

const STORAGE_KEY_TRAY_OPEN = 'basilisk-sound-browser-open';

/**
 * Main orchestration hook for the Sound Browser
 *
 * Combines:
 * - useSampleData (fetching)
 * - useSoundPreview (playback)
 * - usePersistedState (visibility persistence)
 * - Local state (search, category selection)
 *
 * @example
 * const browser = useSoundBrowser();
 *
 * <button onClick={browser.toggle}>
 *   {browser.isOpen ? 'Close' : 'Open'} Sounds
 * </button>
 *
 * {browser.isOpen && (
 *   <SoundBrowserTray {...browser} />
 * )}
 */
export const useSoundBrowser = (): UseSoundBrowserReturn => {
  // Fetch sample data
  const { data, status, error } = useSampleData();

  // Sound preview
  const { previewSample, stopPreview, currentSample } = useSoundPreview();

  // Persisted visibility state
  const [isOpen, setIsOpen] = usePersistedState<boolean>(STORAGE_KEY_TRAY_OPEN, false);

  // Local search state
  const [searchQuery, setSearchQuery] = useState('');

  // Local category selection state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Memoized categories list
  const categories = useMemo(() => {
    return data?.categories ?? [];
  }, [data]);

  return {
    // Visibility
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),

    // Data
    categories,
    isLoading: status === 'loading',
    error,

    // Search
    searchQuery,
    setSearchQuery,

    // Category selection
    selectedCategory,
    setSelectedCategory,

    // Preview
    previewSample,
    stopPreview,
    currentlyPlaying: currentSample
  };
};
