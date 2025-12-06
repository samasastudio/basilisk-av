import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSampleData } from '../useSampleData';
import * as SampleRegistry from '../../services/sampleRegistry';
import type { StrudelSamplesJSON } from '../../types/samples';

describe('useSampleData', () => {
  beforeEach(() => {
    SampleRegistry.clearSampleCache();
    vi.clearAllMocks();
  });

  it('should start with idle status when no cache and immediately begin loading', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useSampleData());

    // Hook immediately transitions from idle to loading on mount
    expect(result.current.status).toBe('loading');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should start with success status when data is cached', async () => {
    // Pre-populate cache
    const mockJSON: StrudelSamplesJSON = {
      _base: 'https://example.com/',
      '808': ['sample.wav']
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJSON
    });

    await SampleRegistry.fetchSampleData();

    // Now create hook - should use cached data
    const { result } = renderHook(() => useSampleData());

    expect(result.current.status).toBe('success');
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.categories).toHaveLength(1);
  });

  it('should fetch data on mount', async () => {
    const mockJSON: StrudelSamplesJSON = {
      _base: 'https://example.com/',
      '808': ['808.wav'],
      'bass': ['bass.wav']
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJSON
    });

    const { result } = renderHook(() => useSampleData());

    // Should start loading
    expect(result.current.status).toBe('loading');

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.categories).toHaveLength(2);
    expect(result.current.data?.totalSamples).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSampleData());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('should handle HTTP errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    const { result } = renderHook(() => useSampleData());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toContain('404');
  });

  it('should allow manual refetch', async () => {
    SampleRegistry.clearSampleCache();

    const mockJSON: StrudelSamplesJSON = {
      _base: 'https://example.com/',
      '808': ['sample.wav']
    };

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        json: async () => mockJSON
      };
    });

    const { result } = renderHook(() => useSampleData());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(callCount).toBe(1);

    // Clear cache to force refetch
    SampleRegistry.clearSampleCache();

    // Trigger refetch
    await result.current.refetch();

    expect(callCount).toBe(2);
    expect(result.current.status).toBe('success');
  });

  it('should not fetch multiple times if already loading', async () => {
    const mockJSON: StrudelSamplesJSON = {
      _base: 'https://example.com/',
      '808': ['sample.wav']
    };

    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = vi.fn().mockReturnValue(fetchPromise);

    const { result } = renderHook(() => useSampleData());

    expect(result.current.status).toBe('loading');

    // Try to refetch while loading
    result.current.refetch();
    result.current.refetch();

    // Should still only call fetch once
    expect(fetch).toHaveBeenCalledTimes(1);

    // Resolve fetch
    resolvePromise!({
      ok: true,
      json: async () => mockJSON
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });

  it('should clear error on successful refetch', async () => {
    // First fetch fails
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSampleData());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Network error');
    });

    // Second fetch succeeds
    const mockJSON: StrudelSamplesJSON = {
      _base: 'https://example.com/',
      '808': ['sample.wav']
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJSON
    });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
  });
});
