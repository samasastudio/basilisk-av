/**
 * Hook for accessing the File System Access API
 * Provides directory picking and file reading capabilities for local samples
 */

import { useState, useCallback } from 'react';

import { isAudioFile, getAudioFormat } from '../types/userLibrary';

import type { SampleItem } from '../types/userLibrary';

// Extend Window interface for File System Access API
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

export interface UseFileSystemAccessReturn {
  /** Whether File System Access API is supported */
  isSupported: boolean;
  /** Currently linked directory handle */
  directoryHandle: FileSystemDirectoryHandle | null;
  /** Name of the linked directory */
  directoryName: string | null;
  /** Sample items tree from the directory */
  items: SampleItem[];
  /** Whether directory is being scanned */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Open directory picker and scan contents */
  linkDirectory: () => Promise<boolean>;
  /** Clear the linked directory */
  unlinkDirectory: () => void;
  /** Get a file from the directory by path */
  getFile: (path: string) => Promise<File | null>;
}

/**
 * Check if File System Access API is supported
 */
const isFileSystemAccessSupported = (): boolean =>
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

/**
 * Sort items: directories first, then alphabetically by name
 */
const sortItems = (items: SampleItem[]): SampleItem[] =>
  [...items].sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });

/**
 * Recursively scan a directory and build the sample tree
 */
const scanDirectory = async (
  handle: FileSystemDirectoryHandle,
  basePath: string = ''
): Promise<SampleItem[]> => {
  const items: SampleItem[] = [];

  for await (const entry of handle.values()) {
    const itemPath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.kind === 'directory') {
      const subHandle = await handle.getDirectoryHandle(entry.name);
      const children = await scanDirectory(subHandle, itemPath);

      // Only include directories that have audio files (directly or nested)
      if (children.length > 0) {
        items.push({
          id: itemPath,
          name: entry.name,
          type: 'directory',
          path: itemPath,
          children: sortItems(children)
        });
      }
    } else if (isAudioFile(entry.name)) {
      const fileHandle = await handle.getFileHandle(entry.name);
      const file = await fileHandle.getFile();
      const blobUrl = URL.createObjectURL(file);

      items.push({
        id: itemPath,
        name: entry.name,
        type: 'sample',
        path: itemPath,
        format: getAudioFormat(entry.name),
        url: blobUrl
      });
    }
  }

  return sortItems(items);
};

/**
 * Hook for File System Access API
 *
 * Features:
 * - Directory picker for selecting sample folder
 * - Recursive directory scanning
 * - Audio file filtering
 * - Blob URL creation for samples
 * - File retrieval by path
 *
 * Browser support:
 * - Chrome 86+, Edge 86+: Full support
 * - Firefox, Safari: Not supported (use fallback)
 */
export const useFileSystemAccess = (): UseFileSystemAccessReturn => {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [items, setItems] = useState<SampleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = isFileSystemAccessSupported();

  /**
   * Open directory picker and scan the selected directory
   */
  const linkDirectory = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('File System Access API is not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const handle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'music'
      });

      setDirectoryHandle(handle);
      setDirectoryName(handle.name);

      // Scan the directory
      const scannedItems = await scanDirectory(handle);
      setItems(scannedItems);

      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);

      if (err instanceof Error) {
        // User cancelled the picker
        if (err.name === 'AbortError') {
          return false;
        }
        setError(err.message);
      } else {
        setError('Failed to access directory');
      }

      return false;
    }
  }, [isSupported]);

  /**
   * Clear the linked directory and revoke blob URLs
   */
  const unlinkDirectory = useCallback((): void => {
    // Revoke all blob URLs to free memory
    const revokeUrls = (itemList: SampleItem[]): void => {
      for (const item of itemList) {
        if (item.type === 'sample' && item.url?.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        } else if (item.children) {
          revokeUrls(item.children);
        }
      }
    };

    revokeUrls(items);

    setDirectoryHandle(null);
    setDirectoryName(null);
    setItems([]);
    setError(null);
  }, [items]);

  /**
   * Get a file from the directory by relative path
   */
  const getFile = useCallback(async (path: string): Promise<File | null> => {
    if (!directoryHandle) {
      return null;
    }

    try {
      const parts = path.split('/');
      let currentHandle: FileSystemDirectoryHandle = directoryHandle;

      // Navigate to parent directories
      for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
      }

      // Get the file
      const fileName = parts[parts.length - 1];
      const fileHandle = await currentHandle.getFileHandle(fileName);
      return await fileHandle.getFile();
    } catch {
      console.error(`Failed to get file: ${path}`);
      return null;
    }
  }, [directoryHandle]);

  return {
    isSupported,
    directoryHandle,
    directoryName,
    items,
    isLoading,
    error,
    linkDirectory,
    unlinkDirectory,
    getFile
  };
};
