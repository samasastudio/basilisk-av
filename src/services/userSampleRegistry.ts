/**
 * Service for registering user samples with Strudel
 * Bridges user samples (local or CDN) to the Strudel audio engine
 */

import { getSampleName, flattenSamples } from '../types/userLibrary';

import type { SampleItem } from '../types/userLibrary';

/** Map of registered sample names to their URLs */
const registeredSamples: Map<string, string> = new Map();

/**
 * Register a single sample with Strudel
 * Note: Strudel expects sample URLs as arrays
 */
export const registerSample = async (name: string, url: string): Promise<void> => {
  // Get the Strudel samples function from window
  const { samples } = window as unknown as { samples?: (config: Record<string, string[]>) => Promise<void> };

  if (!samples) {
    console.warn('Strudel samples function not available');
    return;
  }

  try {
    // Strudel expects arrays of URLs per sample name
    await samples({ [name]: [url] });
    registeredSamples.set(name, url);
  } catch (error) {
    console.error(`Failed to register sample "${name}":`, error);
    throw error;
  }
};

/** Options for registering samples */
export interface RegisterSamplesOptions {
  /** Function to get URL for a sample (for lazy loading local files) */
  getUrl?: (item: SampleItem) => Promise<string | null>;
}

/**
 * Register multiple samples with Strudel
 *
 * @param items - Sample items to register (can include directories)
 * @param options - Optional configuration including URL getter for lazy loading
 * @returns Object with success count and any errors
 */
export const registerSamples = async (
  items: SampleItem[],
  options: RegisterSamplesOptions = {}
): Promise<{
  registered: number;
  errors: string[];
}> => {
  const { getUrl } = options;

  // Strudel expects arrays of URLs per sample name
  const { samples } = window as unknown as { samples?: (config: Record<string, string[]>) => Promise<void> };

  if (!samples) {
    console.warn('Strudel samples function not available');
    return { registered: 0, errors: ['Strudel not initialized'] };
  }

  // Flatten the tree to get only samples
  const sampleList = flattenSamples(items);

  // Build the sample map with arrays of URLs (Strudel format)
  const sampleMap: Record<string, string[]> = {};
  const urlMap: Record<string, string> = {}; // For our internal tracking
  const errors: string[] = [];

  for (const item of sampleList) {
    // Get URL - either from item directly or via the getUrl function (for lazy loading)
    let url = item.url;
    if (!url && getUrl) {
      url = await getUrl(item) ?? undefined;
    }

    if (!url) {
      errors.push(`Sample "${item.name}" has no URL`);
      continue;
    }

    const name = getSampleName(item.name);

    // Check for naming conflicts - add to array if exists
    if (sampleMap[name]) {
      // Add additional URL to existing sample name
      sampleMap[name].push(url);
    } else {
      // Strudel expects arrays of URLs
      sampleMap[name] = [url];
      urlMap[name] = url;
    }
  }

  // Register all samples at once
  try {
    await samples(sampleMap);

    // Update the registered samples map
    for (const [name, url] of Object.entries(urlMap)) {
      registeredSamples.set(name, url);
    }

    return {
      registered: Object.keys(sampleMap).length,
      errors
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[UserSampleRegistry] Failed to register samples:', error);
    return {
      registered: 0,
      errors: [...errors, `Failed to register samples: ${errorMsg}`]
    };
  }
};

/**
 * Unregister all user samples
 * Note: Strudel doesn't have a direct way to unregister samples,
 * so we just clear our local tracking
 */
export const unregisterAllSamples = (): void => {
  registeredSamples.clear();
};

/**
 * Get all currently registered sample names
 */
export const getRegisteredSampleNames = (): string[] => [...registeredSamples.keys()];

/**
 * Check if a sample is registered
 */
export const isSampleRegistered = (name: string): boolean => registeredSamples.has(name);

/**
 * Get the URL for a registered sample
 */
export const getSampleUrl = (name: string): string | undefined => registeredSamples.get(name);
