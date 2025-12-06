import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as SampleRegistry from '../sampleRegistry';
import type { StrudelSamplesJSON } from '../../types/samples';

describe('sampleRegistry', () => {
  beforeEach(() => {
    // Clear cache before each test
    SampleRegistry.clearSampleCache();
    // Clear any mock data
    vi.clearAllMocks();
  });

  describe('parseSampleData', () => {
    it('should parse strudel.json structure correctly', () => {
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/samples/',
        '808': ['808/BD.WAV', '808/SD.WAV', '808/HH.WAV'],
        'bass1': ['bass1/sample1.wav', 'bass1/sample2.wav'],
        'alphabet': ['alphabet/a.wav', 'alphabet/b.wav', 'alphabet/c.wav']
      };

      const result = SampleRegistry.parseSampleData(mockJSON);

      expect(result.baseUrl).toBe('https://example.com/samples/');
      expect(result.categories).toHaveLength(3);
      expect(result.totalSamples).toBe(8); // 3 + 2 + 3
    });

    it('should sort categories alphabetically', () => {
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/',
        'zebra': ['z1.wav'],
        'alpha': ['a1.wav'],
        'beta': ['b1.wav']
      };

      const result = SampleRegistry.parseSampleData(mockJSON);

      expect(result.categories[0].name).toBe('alpha');
      expect(result.categories[1].name).toBe('beta');
      expect(result.categories[2].name).toBe('zebra');
    });

    it('should skip non-array values', () => {
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/',
        '808': ['sample.wav'],
        'invalid': 'not-an-array' as any
      };

      const result = SampleRegistry.parseSampleData(mockJSON);

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe('808');
    });

    it('should calculate count for each category', () => {
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/',
        '808': ['a.wav', 'b.wav', 'c.wav', 'd.wav']
      };

      const result = SampleRegistry.parseSampleData(mockJSON);

      expect(result.categories[0].count).toBe(4);
      expect(result.categories[0].samples).toHaveLength(4);
    });
  });

  describe('fetchSampleData', () => {
    it('should fetch and cache sample data', async () => {
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/',
        '808': ['sample.wav']
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJSON
      });

      const data = await SampleRegistry.fetchSampleData();

      expect(data.categories).toHaveLength(1);
      expect(data.baseUrl).toBe('https://example.com/');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call should return cached data without fetching
      const data2 = await SampleRegistry.fetchSampleData();
      expect(data2).toBe(data); // Same object reference
      expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(SampleRegistry.fetchSampleData()).rejects.toThrow(
        'Failed to fetch samples: 404 Not Found'
      );
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(SampleRegistry.fetchSampleData()).rejects.toThrow('Network error');
    });

    it('should allow retry after error', async () => {
      // First call fails
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(SampleRegistry.fetchSampleData()).rejects.toThrow('Network error');

      // Second call succeeds
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/',
        '808': ['sample.wav']
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJSON
      });

      const data = await SampleRegistry.fetchSampleData();
      expect(data.categories).toHaveLength(1);
    });

    it('should deduplicate concurrent requests', async () => {
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/',
        '808': ['sample.wav']
      };

      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(fetchPromise);

      // Start multiple concurrent requests
      const promise1 = SampleRegistry.fetchSampleData();
      const promise2 = SampleRegistry.fetchSampleData();
      const promise3 = SampleRegistry.fetchSampleData();

      // Resolve the fetch
      resolvePromise!({
        ok: true,
        json: async () => mockJSON
      });

      const [data1, data2, data3] = await Promise.all([promise1, promise2, promise3]);

      // All should return the same data
      expect(data1).toBe(data2);
      expect(data2).toBe(data3);

      // Fetch should only be called once
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCachedSampleData', () => {
    it('should return null when no data is cached', () => {
      expect(SampleRegistry.getCachedSampleData()).toBeNull();
    });

    it('should return cached data after fetch', async () => {
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/',
        '808': ['sample.wav']
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJSON
      });

      await SampleRegistry.fetchSampleData();

      const cached = SampleRegistry.getCachedSampleData();
      expect(cached).not.toBeNull();
      expect(cached?.categories).toHaveLength(1);
    });
  });

  describe('clearSampleCache', () => {
    it('should clear cached data', async () => {
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/',
        '808': ['sample.wav']
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJSON
      });

      await SampleRegistry.fetchSampleData();
      expect(SampleRegistry.getCachedSampleData()).not.toBeNull();

      SampleRegistry.clearSampleCache();
      expect(SampleRegistry.getCachedSampleData()).toBeNull();
    });
  });

  describe('isFetching', () => {
    it('should return false when not fetching', () => {
      expect(SampleRegistry.isFetching()).toBe(false);
    });

    it('should return true during fetch', async () => {
      const mockJSON: StrudelSamplesJSON = {
        _base: 'https://example.com/',
        '808': ['sample.wav']
      };

      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(fetchPromise);

      const promise = SampleRegistry.fetchSampleData();

      expect(SampleRegistry.isFetching()).toBe(true);

      resolvePromise!({
        ok: true,
        json: async () => mockJSON
      });

      await promise;

      expect(SampleRegistry.isFetching()).toBe(false);
    });
  });
});
