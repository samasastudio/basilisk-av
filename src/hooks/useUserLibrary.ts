/**
 * Main orchestration hook for User Sound Library
 * Combines file system access, CDN loading, and sample registration
 */

import { useState, useCallback, useMemo, useEffect } from 'react';

import * as UserSampleRegistry from '../services/userSampleRegistry';

import { useCDNSamples } from './useCDNSamples';
import { useFileSystemAccess } from './useFileSystemAccess';
import { usePersistedState } from './usePersistedState';


import type { UsePanelExclusivityReturn } from './usePanelExclusivity';
import type { SampleItem, SampleSource } from '../types/userLibrary';

export interface UseUserLibraryReturn {
  // Panel visibility (integrated with panel exclusivity)
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Source selection
  source: SampleSource | null;
  setSource: (source: SampleSource) => void;
  sourceName: string | null;

  // Data
  items: SampleItem[];
  flatItems: SampleItem[];
  isLoading: boolean;
  error: string | null;

  // Local files
  isFileSystemSupported: boolean;
  linkLocalDirectory: () => Promise<boolean>;

  // CDN
  cdnUrl: string | null;
  linkCDN: (url: string) => Promise<boolean>;

  // Common actions
  unlinkSource: () => void;

  // Tree state
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredItems: SampleItem[];

  // Registration status
  isRegistered: boolean;
  registeredCount: number;

  // Lazy blob URL loading (for local files)
  /** Get or create a blob URL for a local sample. Returns the URL directly for CDN samples. */
  getSampleUrl: (item: SampleItem) => Promise<string | null>;
}

const STORAGE_KEY_SOURCE = 'basilisk-user-library-source';
const STORAGE_KEY_EXPANDED = 'basilisk-user-library-expanded';

/**
 * Recursively filter items by search query
 */
const filterItems = (items: SampleItem[], query: string): SampleItem[] => {
  const lowerQuery = query.toLowerCase();
  const result: SampleItem[] = [];

  for (const item of items) {
    if (item.type === 'sample') {
      if (item.name.toLowerCase().includes(lowerQuery)) {
        result.push(item);
      }
    } else if (item.children) {
      const filteredChildren = filterItems(item.children, query);
      if (filteredChildren.length > 0) {
        result.push({
          ...item,
          children: filteredChildren
        });
      } else if (item.name.toLowerCase().includes(lowerQuery)) {
        // Include directory if its name matches, with all children
        result.push(item);
      }
    }
  }

  return result;
};

/**
 * Flatten items to get all samples
 */
const flattenItems = (items: SampleItem[]): SampleItem[] => {
  const result: SampleItem[] = [];

  for (const item of items) {
    if (item.type === 'sample') {
      result.push(item);
    } else if (item.children) {
      result.push(...flattenItems(item.children));
    }
  }

  return result;
};

/**
 * Get all paths from items (for expand all)
 */
const getAllPaths = (items: SampleItem[]): string[] => {
  const paths: string[] = [];

  for (const item of items) {
    if (item.type === 'directory') {
      paths.push(item.path);
      if (item.children) {
        paths.push(...getAllPaths(item.children));
      }
    }
  }

  return paths;
};

interface TreeExpansionReturn {
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

/** Hook for tree expansion state management */
const useTreeExpansion = (items: SampleItem[]): TreeExpansionReturn => {
  const [expandedPathsArray, setExpandedPathsArray] = usePersistedState<string[]>(STORAGE_KEY_EXPANDED, []);
  const expandedPaths = useMemo(() => new Set(expandedPathsArray), [expandedPathsArray]);

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPathsArray((prev) => {
      const set = new Set(prev);
      if (set.has(path)) { set.delete(path); } else { set.add(path); }
      return [...set];
    });
  }, [setExpandedPathsArray]);

  const expandAll = useCallback(() => setExpandedPathsArray(getAllPaths(items)), [items, setExpandedPathsArray]);
  const collapseAll = useCallback(() => setExpandedPathsArray([]), [setExpandedPathsArray]);

  return { expandedPaths, toggleExpanded, expandAll, collapseAll };
};

interface UseUserLibraryOptions {
  panelState?: UsePanelExclusivityReturn;
  /** Whether the Strudel audio engine is ready - samples are registered when this becomes true */
  engineReady?: boolean;
}

/** Main User Library hook - combines file system, CDN, and registration */
export const useUserLibrary = (options: UseUserLibraryOptions = {}): UseUserLibraryReturn => {
  const { panelState, engineReady = false } = options;
  const [source, setSourceState] = usePersistedState<SampleSource | null>(STORAGE_KEY_SOURCE, null);
  const fileSystem = useFileSystemAccess();
  const cdn = useCDNSamples();

  // Panel visibility
  const isOpen = panelState?.isUserLibraryOpen ?? false;
  const open = useCallback(() => panelState?.openUserLibrary(), [panelState]);
  const close = useCallback(() => panelState?.closePanel(), [panelState]);
  const toggle = useCallback(() => panelState?.toggleUserLibrary(), [panelState]);

  // Search and registration state
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);

  // Get items based on current source
  const items = useMemo((): SampleItem[] => {
    if (source === 'local') return fileSystem.items;
    if (source === 'cdn') return cdn.items;
    return [];
  }, [source, fileSystem.items, cdn.items]);

  const flatItems = useMemo(() => flattenItems(items), [items]);
  const { expandedPaths, toggleExpanded, expandAll, collapseAll } = useTreeExpansion(items);

  // Get source name
  const sourceName = useMemo((): string | null => {
    if (source === 'local') return fileSystem.directoryName;
    if (source === 'cdn') return cdn.baseUrl;
    return null;
  }, [source, fileSystem.directoryName, cdn.baseUrl]);

  const isLoading = source === 'local' ? fileSystem.isLoading : cdn.isLoading;
  const error = source === 'local' ? fileSystem.error : cdn.error;

  const setSource = useCallback((newSource: SampleSource) => {
    setSourceState(newSource);
    setIsRegistered(false);
  }, [setSourceState]);

  const linkLocalDirectory = useCallback(async (): Promise<boolean> => {
    setSource('local');
    const success = await fileSystem.linkDirectory();
    if (success) setIsRegistered(false);
    return success;
  }, [setSource, fileSystem]);

  const linkCDN = useCallback(async (url: string): Promise<boolean> => {
    setSource('cdn');
    const success = await cdn.linkCDN(url);
    if (success) setIsRegistered(false);
    return success;
  }, [setSource, cdn]);

  const unlinkSource = useCallback(() => {
    if (source === 'local') fileSystem.unlinkDirectory();
    else if (source === 'cdn') cdn.unlinkCDN();
    setSourceState(null);
    setIsRegistered(false);
    setRegisteredCount(0);
    UserSampleRegistry.unregisterAllSamples();
  }, [source, fileSystem, cdn, setSourceState]);

  const filteredItems = useMemo(() => searchQuery.trim() ? filterItems(items, searchQuery) : items, [items, searchQuery]);

  /**
   * Get the URL for a sample (lazy loading for local files).
   * For CDN samples, returns the URL directly.
   * For local samples, creates a blob URL on-demand.
   */
  const getSampleUrl = useCallback(async (item: SampleItem): Promise<string | null> => {
    if (item.type !== 'sample') return null;

    // CDN samples already have URLs
    if (source === 'cdn' && item.url) {
      return item.url;
    }

    // Local samples need lazy blob URL creation
    if (source === 'local') {
      return fileSystem.getBlobUrl(item.path);
    }

    return null;
  }, [source, fileSystem]);

  // Auto-register samples when items change OR when engine becomes ready
  // Samples must be registered after the audio engine starts for Strudel to find them
  useEffect(() => {
    const registerAllSamples = async (): Promise<void> => {
      if (items.length === 0) {
        setIsRegistered(false);
        setRegisteredCount(0);
        return;
      }

      // Only register if engine is ready - otherwise samples won't be found
      if (!engineReady) {
        setIsRegistered(false);
        return;
      }

      try {
        // For local files, provide a URL getter since URLs are created lazily
        const getUrl = source === 'local'
          ? async (item: SampleItem): Promise<string | null> => fileSystem.getBlobUrl(item.path)
          : undefined;

        const result = await UserSampleRegistry.registerSamples(items, { getUrl });
        setIsRegistered(true);
        setRegisteredCount(result.registered);

        if (result.errors.length > 0) {
          console.warn('Sample registration warnings:', result.errors);
        }
      } catch (err) {
        console.error('Failed to register samples:', err);
        setIsRegistered(false);
      }
    };

    registerAllSamples();
  }, [items, engineReady, source, fileSystem]);

  return {
    // Panel visibility
    isOpen,
    open,
    close,
    toggle,

    // Source selection
    source,
    setSource,
    sourceName,

    // Data
    items,
    flatItems,
    isLoading,
    error,

    // Local files
    isFileSystemSupported: fileSystem.isSupported,
    linkLocalDirectory,

    // CDN
    cdnUrl: cdn.baseUrl,
    linkCDN,

    // Common actions
    unlinkSource,

    // Tree state
    expandedPaths,
    toggleExpanded,
    expandAll,
    collapseAll,

    // Search
    searchQuery,
    setSearchQuery,
    filteredItems,

    // Registration
    isRegistered,
    registeredCount,

    // Lazy blob URL loading
    getSampleUrl
  };
};
