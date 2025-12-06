/**
 * React hook for fetching and managing Strudel sample data
 */

import { useEffect, useState } from 'react';
import type { FetchStatus, SampleData } from '../types/samples';
import * as SampleRegistry from '../services/sampleRegistry';

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
 * Hook to fetch and cache Strudel sample data
 *
 * Automatically fetches on mount. Uses module-level caching
 * so subsequent calls return cached data instantly.
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
  const [data, setData] = useState<SampleData | null>(
    () => SampleRegistry.getCachedSampleData()
  );
  const [status, setStatus] = useState<FetchStatus>(() => {
    const cached = SampleRegistry.getCachedSampleData();
    return cached ? 'success' : 'idle';
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (): Promise<void> => {
    // Don't fetch if already fetching
    if (status === 'loading') return;

    setStatus('loading');
    setError(null);

    try {
      const sampleData = await SampleRegistry.fetchSampleData();
      setData(sampleData);
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sample data';
      setError(message);
      setStatus('error');
      console.error('useSampleData:', message);
    }
  };

  // Fetch on mount (only if not already cached)
  useEffect(() => {
    if (status === 'idle') {
      fetchData();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    status,
    error,
    refetch: fetchData
  };
};
