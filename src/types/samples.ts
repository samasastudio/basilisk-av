/**
 * Type definitions for Strudel sample data
 */

/**
 * A sample category from the Dirt Samples library
 */
export interface SampleCategory {
  /** Category name (e.g., "808", "bass1", "alphabet") */
  name: string;
  /** Array of sample file paths relative to base URL */
  samples: string[];
  /** Number of samples in this category */
  count: number;
}

/**
 * Complete sample data structure
 */
export interface SampleData {
  /** All sample categories */
  categories: SampleCategory[];
  /** Base URL for sample files */
  baseUrl: string;
  /** Total number of samples across all categories */
  totalSamples: number;
}

/**
 * Status of asynchronous sample data fetching
 */
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Raw JSON structure from strudel.json
 */
export interface StrudelSamplesJSON {
  /** Base URL for all sample files */
  _base: string;
  /** Category names mapped to arrays of file paths */
  [category: string]: string | string[];
}
