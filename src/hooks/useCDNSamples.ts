/**
 * Hook for loading samples from a CDN or remote URL
 * Supports JSON manifest format and direct URL configuration
 */

import { useState, useCallback } from 'react';

import { isAudioFile, getAudioFormat } from '../types/userLibrary';

import { usePersistedState } from './usePersistedState';

import type { SampleItem } from '../types/userLibrary';

export interface CDNManifest {
  /** Array of sample filenames or paths */
  samples?: string[];
  /** Nested structure with directories */
  directories?: Record<string, CDNManifest>;
}

export interface UseCDNSamplesReturn {
  /** Base URL for samples */
  baseUrl: string | null;
  /** Sample items tree */
  items: SampleItem[];
  /** Whether samples are being loaded */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Link a CDN URL (fetches manifest) */
  linkCDN: (url: string) => Promise<boolean>;
  /** Clear the linked CDN */
  unlinkCDN: () => void;
}

const STORAGE_KEY = 'basilisk-user-library-cdn-url';

/**
 * Sort items: directories first, then alphabetically
 */
const sortItems = (items: SampleItem[]): SampleItem[] =>
  [...items].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

/**
 * Create a sample item from a path
 */
const createSampleItem = (baseUrl: string, path: string, name: string): SampleItem => {
  const fullUrl = `${baseUrl.replace(/\/$/, '')}/${path}`;
  return {
    id: path,
    name,
    type: 'sample',
    path,
    format: getAudioFormat(name),
    url: fullUrl
  };
};

/**
 * Create a directory item
 */
const createDirectoryItem = (path: string, name: string, children: SampleItem[] = []): SampleItem => ({
  id: path,
  name,
  type: 'directory',
  path,
  children
});

/**
 * Process a directory part in path building
 */
const processDirectoryPart = (
  currentLevel: Map<string, SampleItem>,
  part: string,
  currentPath: string
): Map<string, SampleItem> => {
  let dirItem = currentLevel.get(part);

  if (!dirItem) {
    dirItem = createDirectoryItem(currentPath, part, []);
    currentLevel.set(part, dirItem);
  }

  dirItem.children ??= [];

  // Convert children array to map for easier manipulation
  const childMap = new Map<string, SampleItem>();
  for (const child of dirItem.children) {
    childMap.set(child.name, child);
  }

  // Update children from map
  dirItem.children = [...childMap.values()];

  return childMap;
};

/**
 * Build sample tree from a flat list of paths
 */
const buildTreeFromPaths = (baseUrl: string, paths: string[]): SampleItem[] => {
  const root: Map<string, SampleItem> = new Map();

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean);
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (isLast && isAudioFile(part)) {
        // It's a sample file
        currentLevel.set(part, createSampleItem(baseUrl, path, part));
      } else {
        // It's a directory - process and move to next level
        currentLevel = processDirectoryPart(currentLevel, part, currentPath);
      }
    }
  }

  return sortItems([...root.values()]);
};

/**
 * Build sample tree from manifest structure
 */
const buildTreeFromManifest = (baseUrl: string, manifest: CDNManifest, basePath: string = ''): SampleItem[] => {
  const items: SampleItem[] = [];

  // Add samples from this level
  if (manifest.samples) {
    for (const sample of manifest.samples) {
      if (isAudioFile(sample)) {
        const path = basePath ? `${basePath}/${sample}` : sample;
        items.push(createSampleItem(baseUrl, path, sample));
      }
    }
  }

  // Add directories recursively
  if (manifest.directories) {
    for (const [dirName, subManifest] of Object.entries(manifest.directories)) {
      const dirPath = basePath ? `${basePath}/${dirName}` : dirName;
      const children = buildTreeFromManifest(baseUrl, subManifest, dirPath);

      if (children.length > 0) {
        items.push(createDirectoryItem(dirPath, dirName, sortItems(children)));
      }
    }
  }

  return sortItems(items);
};

/**
 * Hook for loading samples from CDN
 *
 * Supports two manifest formats:
 *
 * 1. Simple array of sample paths:
 * {
 *   "samples": ["kick.wav", "snare.wav", "hihat/open.wav"]
 * }
 *
 * 2. Nested directory structure:
 * {
 *   "directories": {
 *     "drums": {
 *       "samples": ["kick.wav", "snare.wav"],
 *       "directories": {
 *         "hihat": { "samples": ["open.wav", "closed.wav"] }
 *       }
 *     }
 *   }
 * }
 */
export const useCDNSamples = (): UseCDNSamplesReturn => {
  const [baseUrl, setBaseUrl] = usePersistedState<string | null>(STORAGE_KEY, null);
  const [items, setItems] = useState<SampleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Link a CDN URL and fetch the manifest
   */
  const linkCDN = useCallback(async (url: string): Promise<boolean> => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Normalize URL
      const normalizedUrl = url.replace(/\/$/, '');
      const manifestUrl = `${normalizedUrl}/samples.json`;

      // Fetch the manifest
      const response = await fetch(manifestUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
      }

      const manifest: CDNManifest = await response.json();

      // Build the sample tree
      let sampleItems: SampleItem[];

      if (manifest.samples && Array.isArray(manifest.samples)) {
        // Simple flat list
        sampleItems = buildTreeFromPaths(normalizedUrl, manifest.samples);
      } else if (manifest.directories) {
        // Nested structure
        sampleItems = buildTreeFromManifest(normalizedUrl, manifest);
      } else {
        throw new Error('Invalid manifest format: expected "samples" array or "directories" object');
      }

      if (sampleItems.length === 0) {
        throw new Error('No audio samples found in manifest');
      }

      setBaseUrl(normalizedUrl);
      setItems(sampleItems);
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load samples from CDN');
      }

      return false;
    }
  }, [setBaseUrl]);

  /**
   * Clear the linked CDN
   */
  const unlinkCDN = useCallback((): void => {
    setBaseUrl(null);
    setItems([]);
    setError(null);
  }, [setBaseUrl]);

  return {
    baseUrl,
    items,
    isLoading,
    error,
    linkCDN,
    unlinkCDN
  };
};
