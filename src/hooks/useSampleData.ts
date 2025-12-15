/**
 * React hook for fetching and managing Strudel sample data
 */

import { useQuery } from '@tanstack/react-query';

import * as SampleRegistry from '../services/sampleRegistry';

import type { FetchStatus, SampleData } from '../types/samples';

export interface UseSampleDataReturn {
  /** Sample data (null until loaded) */
  data: SampleData | null;
  /** Current fetch status */
  status: FetchStatus;
  /** Error message if status is 'error' */
  error: string | null;
  /** Manually trigger a refetch */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache Strudel sample data using TanStack Query
 *
 * Automatically fetches on mount with intelligent caching, deduplication,
 * and automatic retry logic. TanStack Query handles all the complexity
 * of data fetching, caching, and synchronization.
 *
 * @example
 * const { data, status, error } = useSampleData();
 *
 * if (status === 'loading') return <div>Loading samples...</div>;
 * if (status === 'error') return <div>Error: {error}</div>;
 * if (!data) return null;
 *
 * return <div>{data.categories.length} categories</div>;
 */
export const useSampleData = (): UseSampleDataReturn => {
  const query = useQuery({
    queryKey: ['samples'],
    queryFn: SampleRegistry.fetchSampleData,
    // Query options are set globally in App.tsx QueryClient config
  });

  // Map TanStack Query states to our custom FetchStatus type
  let status: FetchStatus = 'idle';
  if (query.isPending) {
    status = 'loading';
  } else if (query.isError) {
    status = 'error';
  } else if (query.isSuccess) {
    status = 'success';
  }

  return {
    data: query.data ?? null,
    status,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: async () => {
      await query.refetch();
    },
  };
};
