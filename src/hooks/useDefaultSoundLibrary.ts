import { useQuery } from '@tanstack/react-query';

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
 * Uses React Query to trigger a one-time CDN link when configured.
 * - linkCDN manages its own loading/error state in useUserLibrary
 * - Sample registration is handled by useUserLibrary when engine becomes ready
 *
 * @param userLibrary - The useUserLibrary return object
 * @returns Loading/registration state (delegated to useUserLibrary)
 */
export const useDefaultSoundLibrary = (
  userLibrary: UseUserLibraryReturn
): UseDefaultSoundLibraryReturn => {
  const rawLibraryUrl = import.meta.env.VITE_DEFAULT_SOUND_LIBRARY as string | undefined;
  const libraryUrl = rawLibraryUrl ? normalizeUrl(rawLibraryUrl) : null;

  const {
    isLoading: isLoadingDefault,
    error: defaultError,
    refetch,
  } = useQuery({
    queryKey: ['defaultSoundLibrary', libraryUrl],
    queryFn: async () => {
      if (!libraryUrl) {
        throw new Error('No default sound library configured');
      }
      const success = await userLibrary.linkCDN(libraryUrl);
      if (!success) {
        throw new Error(userLibrary.error ?? 'Failed to load sound library');
      }
      return success;
    },
    enabled: Boolean(libraryUrl) && userLibrary.source === null,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  const isUsingDefault = Boolean(
    libraryUrl &&
    userLibrary.source === 'cdn' &&
    (userLibrary.cdnUrl === libraryUrl || isLoadingDefault || Boolean(defaultError))
  );

  const defaultErrorMessage = defaultError instanceof Error ? defaultError.message : userLibrary.error;
  const effectiveError = isUsingDefault ? defaultErrorMessage : null;

  const retry = libraryUrl ? (): Promise<unknown> => refetch() : null;

  return {
    libraryUrl,
    isConfigured: Boolean(libraryUrl),
    isLoading: isUsingDefault ? userLibrary.isLoading || isLoadingDefault : false,
    error: effectiveError,
    registeredCount: userLibrary.registeredCount,
    isRegistered: userLibrary.isRegistered,
    isUsingDefault,
    retry: retry as (() => Promise<boolean>) | null,
  };
};
