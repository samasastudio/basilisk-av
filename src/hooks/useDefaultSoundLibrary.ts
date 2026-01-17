import { useEffect, useRef } from 'react';

import type { UseUserLibraryReturn } from './useUserLibrary';

interface UseDefaultSoundLibraryReturn {
  /** Base URL of the library (for display) */
  libraryUrl: string | null;
  /** Whether library is configured via env */
  isConfigured: boolean;
  /** Whether library is currently being loaded */
  isLoading: boolean;
  /** Error message if load failed */
  error: string | null;
  /** Number of samples registered */
  registeredCount: number;
  /** Whether registration is complete */
  isRegistered: boolean;
  /** Whether the default library is currently active */
  isUsingDefault: boolean;
  /** Retry loading the default library (if configured) */
  retry: (() => Promise<boolean>) | null;
}

const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

/**
 * Hook to auto-load a sound library from environment variable.
 *
 * Uses lazy initialization pattern - triggers linkCDN on first render when conditions are met.
 * No useEffect needed because:
 * - linkCDN manages its own loading/error state in useUserLibrary
 * - ref tracks whether we've attempted load (survives re-renders)
 * - Sample registration is handled by useUserLibrary when engine becomes ready
 *
 * @param userLibrary - The useUserLibrary return object
 * @returns Loading/registration state (delegated to useUserLibrary)
 */
export const useDefaultSoundLibrary = (
  userLibrary: UseUserLibraryReturn
): UseDefaultSoundLibraryReturn => {
  const hasAttemptedLoad = useRef(false);
  const rawLibraryUrl = import.meta.env.VITE_DEFAULT_SOUND_LIBRARY as string | undefined;
  const libraryUrl = rawLibraryUrl ? normalizeUrl(rawLibraryUrl) : null;

  useEffect(() => {
    if (!libraryUrl || hasAttemptedLoad.current || userLibrary.source !== null) {
      return;
    }
    hasAttemptedLoad.current = true;
    void userLibrary.linkCDN(libraryUrl);
  }, [libraryUrl, userLibrary]);

  const isUsingDefault = Boolean(
    libraryUrl &&
    userLibrary.source === 'cdn' &&
    (userLibrary.cdnUrl === libraryUrl || userLibrary.isLoading)
  );

  const retry = libraryUrl ? (): Promise<boolean> => {
    hasAttemptedLoad.current = true;
    return userLibrary.linkCDN(libraryUrl);
  } : null;

  return {
    libraryUrl,
    isConfigured: Boolean(libraryUrl),
    isLoading: isUsingDefault ? userLibrary.isLoading : false,
    error: isUsingDefault ? userLibrary.error : null,
    registeredCount: userLibrary.registeredCount,
    isRegistered: userLibrary.isRegistered,
    isUsingDefault,
    retry,
  };
};
