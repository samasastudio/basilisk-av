/**
 * Orchestration hook for sound browser state
 */

import { useState, useMemo, useCallback } from 'react';

import { categorizeToGroup, getAllGroupNames } from '../config/sampleGroups';

import { usePersistedState } from './usePersistedState';
import { useSampleData } from './useSampleData';
import { useSoundPreview } from './useSoundPreview';

import type { UsePanelExclusivityReturn } from './usePanelExclusivity';
import type { SampleCategory } from '../types/samples';

export interface CategorizedSampleCategory extends SampleCategory {
  /** The group this category belongs to */
  group: string;
}

export interface UseSoundBrowserReturn {
  // Visibility
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Data
  categories: CategorizedSampleCategory[];
  filteredCategories: CategorizedSampleCategory[];
  isLoading: boolean;
  error: string | null;

  // Groups
  groups: string[];
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;

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
  canPreview: boolean;
}

const STORAGE_KEY_TRAY_OPEN = 'basilisk-sound-browser-open';
const STORAGE_KEY_GROUP = 'basilisk-sound-browser-group';

/**
 * Main orchestration hook for the Sound Browser
 *
 * Combines:
 * - useSampleData (fetching)
 * - useSoundPreview (playback)
 * - usePersistedState (visibility persistence)
 * - Sample grouping by instrument type
 * - Local state (search, category selection)
 *
 * @param engineReady - Whether the Strudel engine is initialized and ready
 * @param panelState - Optional panel exclusivity state (when provided, uses shared panel state)
 */
export const useSoundBrowser = (
  engineReady: boolean,
  panelState?: UsePanelExclusivityReturn
): UseSoundBrowserReturn => {
  // Fetch sample data
  const { data, status, error } = useSampleData();

  // Sound preview
  const { previewSample, stopPreview, currentSample, canPreview } = useSoundPreview(engineReady);

  // Persisted visibility state (fallback when panelState not provided)
  const [internalIsOpen, setInternalIsOpen] = usePersistedState<boolean>(STORAGE_KEY_TRAY_OPEN, false);

  // Use panel state if provided, otherwise use internal state
  const isOpen = panelState ? panelState.isSoundBrowserOpen : internalIsOpen;

  const open = useCallback(() => {
    if (panelState) {
      panelState.openSoundBrowser();
    } else {
      setInternalIsOpen(true);
    }
  }, [panelState, setInternalIsOpen]);

  const close = useCallback(() => {
    if (panelState) {
      panelState.closePanel();
    } else {
      setInternalIsOpen(false);
    }
  }, [panelState, setInternalIsOpen]);

  const toggle = useCallback(() => {
    if (panelState) {
      panelState.toggleSoundBrowser();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  }, [panelState, setInternalIsOpen]);

  // Persisted group selection
  const [selectedGroup, setSelectedGroup] = usePersistedState<string>(STORAGE_KEY_GROUP, 'All');

  // Local search state
  const [searchQuery, setSearchQuery] = useState('');

  // Local category selection state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all group names
  const groups = useMemo(() => getAllGroupNames(), []);

  // Categorize all samples into groups
  const categories = useMemo((): CategorizedSampleCategory[] => {
    if (!data?.categories) return [];

    return data.categories.map((cat) => ({
      ...cat,
      group: categorizeToGroup(cat.name)
    }));
  }, [data]);

  // Filter categories by group and search query
  const filteredCategories = useMemo((): CategorizedSampleCategory[] => {
    let filtered = categories;

    // Filter by group (unless "All" is selected)
    if (selectedGroup !== 'All') {
      filtered = filtered.filter((cat) => cat.group === selectedGroup);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((cat) => cat.name.toLowerCase().includes(query));
    }

    return filtered;
  }, [categories, selectedGroup, searchQuery]);

  // Clear category selection when group changes
  const handleGroupChange = (group: string): void => {
    setSelectedGroup(group);
    setSelectedCategory(null);
  };

  return {
    // Visibility
    isOpen,
    open,
    close,
    toggle,

    // Data
    categories,
    filteredCategories,
    isLoading: status === 'loading',
    error,

    // Groups
    groups,
    selectedGroup,
    setSelectedGroup: handleGroupChange,

    // Search
    searchQuery,
    setSearchQuery,

    // Category selection
    selectedCategory,
    setSelectedCategory,

    // Preview
    previewSample,
    stopPreview,
    currentlyPlaying: currentSample,
    canPreview
  };
};
