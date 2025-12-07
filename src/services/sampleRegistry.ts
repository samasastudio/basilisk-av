/**
 * Sample Registry Service
 * Fetches, parses, and caches Strudel Dirt Samples metadata
 */

import type { SampleCategory, SampleData, StrudelSamplesJSON } from '../types/samples';

const STRUDEL_SAMPLES_URL = 'https://raw.githubusercontent.com/tidalcycles/dirt-samples/master/strudel.json';

// Module-level cache (not localStorage - too large)
let cachedSampleData: SampleData | null = null;
let fetchPromise: Promise<SampleData> | null = null;

/**
 * Parse raw strudel.json into structured SampleData
 */
export const parseSampleData = (json: StrudelSamplesJSON): SampleData => {
  const baseUrl = json._base;
  const categories: SampleCategory[] = [];
  let totalSamples = 0;

  // Process each key except _base
  for (const [key, value] of Object.entries(json)) {
    if (key === '_base') continue;

    // Skip if not an array (defensive)
    if (!Array.isArray(value)) continue;

    categories.push({
      name: key,
      samples: value,
      count: value.length
    });

    totalSamples += value.length;
  }

  // Sort categories alphabetically
  categories.sort((a, b) => a.name.localeCompare(b.name));

  return {
    categories,
    baseUrl,
    totalSamples
  };
};

/**
 * Fetch sample data from GitHub
 * Implements caching and deduplication
 */
export const fetchSampleData = async (): Promise<SampleData> => {
  // Return cached data if available
  if (cachedSampleData) {
    return cachedSampleData;
  }

  // Return in-flight request if one exists (prevents duplicate fetches)
  if (fetchPromise) {
    return fetchPromise;
  }

  // Create new fetch promise
  fetchPromise = (async () => {
    try {
      const response = await fetch(STRUDEL_SAMPLES_URL);

      if (!response.ok) {
        throw new Error(`Failed to fetch samples: ${response.status} ${response.statusText}`);
      }

      const json: StrudelSamplesJSON = await response.json();
      const data = parseSampleData(json);

      // Cache the result
      cachedSampleData = data;

      return data;
    } catch (error) {
      // Don't cache failed fetches
      cachedSampleData = null;
      throw error;
    } finally {
      // Clear promise after completion (success or error)
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};

/**
 * Get cached sample data if available
 */
export const getCachedSampleData = (): SampleData | null => cachedSampleData;

/**
 * Clear the cache (useful for testing)
 */
export const clearSampleCache = (): void => {
  cachedSampleData = null;
  fetchPromise = null;
};

/**
 * Check if data is currently being fetched
 */
export const isFetching = (): boolean => fetchPromise !== null;
