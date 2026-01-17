import { useQuery } from '@tanstack/react-query';

interface UseDefaultScriptReturn {
  /** Script content if loaded successfully */
  content: string | null;
  /** Whether script is currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Path/URL of the script (for display) */
  source: string | null;
  /** Retry loading the script (if configured) */
  retry: (() => Promise<unknown>) | null;
}

const SCRIPT_TIMEOUT_MS = 5000;

/**
 * Fetch script content from a URL/path.
 * Throws on HTTP errors for React Query to handle.
 */
const fetchScript = async (scriptPath: string, signal?: AbortSignal): Promise<string> => {
  const timeoutController = new AbortController();
  let didTimeout = false;
  const timeoutId = window.setTimeout(() => {
    didTimeout = true;
    timeoutController.abort();
  }, SCRIPT_TIMEOUT_MS);

  const handleAbort = (): void => {
    if (!timeoutController.signal.aborted) {
      timeoutController.abort();
    }
  };

  if (signal) {
    if (signal.aborted) {
      handleAbort();
    } else {
      signal.addEventListener('abort', handleAbort, { once: true });
    }
  }

  try {
    const response = await fetch(scriptPath, { signal: timeoutController.signal });

    if (!response.ok) {
      throw new Error(`Failed to load script: ${response.status} ${response.statusText}`);
    }

    return response.text();
  } catch (error) {
    if (didTimeout) {
      throw new Error('Script load timed out after 5 seconds');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', handleAbort);
    }
  }
};

/**
 * Hook to load a default script from environment variable.
 * Uses TanStack Query for caching, loading states, and automatic cleanup.
 *
 * @returns Script content, loading state, and error state
 */
export const useDefaultScript = (): UseDefaultScriptReturn => {
  const scriptPath = import.meta.env.VITE_DEFAULT_SCRIPT as string | undefined;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['defaultScript', scriptPath],
    queryFn: ({ signal }) => {
      if (!scriptPath) {
        throw new Error('No default script configured');
      }
      return fetchScript(scriptPath, signal);
    },
    enabled: Boolean(scriptPath),
    staleTime: Infinity, // Never refetch - script doesn't change
    gcTime: Infinity, // Keep cached forever
    retry: false, // Don't retry on failure
  });

  return {
    content: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    source: scriptPath ?? null,
    retry: scriptPath ? () => refetch() : null,
  };
};
