import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as AudioBridge from '../audioBridge';

import type { HydraBridge } from '../audioBridge';

describe('audioBridge service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).a;
  });

  describe('isBridgeActive', () => {
    it('returns false when bridge not initialized', () => {
      expect(AudioBridge.isBridgeActive()).toBe(false);
    });

    it('returns false when window.a exists but no fft', () => {
      (window as any).a = {};
      expect(AudioBridge.isBridgeActive()).toBe(false);
    });

    it('returns true when bridge initialized with fft', () => {
      (window as any).a = { fft: [0.5, 0.3, 0.2, 0.1] };
      expect(AudioBridge.isBridgeActive()).toBe(true);
    });
  });

  describe('getBridgeFFT', () => {
    it('returns 0 when bridge not active', () => {
      expect(AudioBridge.getBridgeFFT(0)).toBe(0);
    });

    it('returns 0 when index is undefined', () => {
      (window as any).a = { fft: [0.5, 0.3, 0.2, 0.1] };
      expect(AudioBridge.getBridgeFFT(10)).toBe(0);
    });

    it('returns FFT value for valid index', () => {
      (window as any).a = { fft: [0.5, 0.3, 0.2, 0.1] };
      expect(AudioBridge.getBridgeFFT(0)).toBe(0.5);
      expect(AudioBridge.getBridgeFFT(2)).toBe(0.2);
      expect(AudioBridge.getBridgeFFT(3)).toBe(0.1);
    });

    it('defaults to index 0 when no argument provided', () => {
      (window as any).a = { fft: [0.7, 0.3, 0.2, 0.1] };
      expect(AudioBridge.getBridgeFFT()).toBe(0.7);
    });

    it('returns 0 for out of bounds index', () => {
      (window as any).a = { fft: [0.5, 0.3] };
      expect(AudioBridge.getBridgeFFT(10)).toBe(0);
      expect(AudioBridge.getBridgeFFT(-1)).toBe(0);
    });
  });

  describe('getAllFFT', () => {
    it('returns empty array when bridge not active', () => {
      expect(AudioBridge.getAllFFT()).toEqual([]);
    });

    it('returns all FFT values', () => {
      const fftData = [0.5, 0.3, 0.2, 0.1];
      (window as any).a = { fft: fftData };
      expect(AudioBridge.getAllFFT()).toEqual(fftData);
    });

    it('returns reference to actual array', () => {
      const fftData = [0.5, 0.3, 0.2, 0.1];
      (window as any).a = { fft: fftData };
      const result = AudioBridge.getAllFFT();
      expect(result).toBe(fftData); // Same reference
    });
  });

  describe('getBinCount', () => {
    it('returns 0 when bridge not active', () => {
      expect(AudioBridge.getBinCount()).toBe(0);
    });

    it('returns bin count when bridge active', () => {
      (window as any).a = { fft: [0, 0, 0, 0], bins: 4 };
      expect(AudioBridge.getBinCount()).toBe(4);
    });

    it('returns correct bin count for different sizes', () => {
      (window as any).a = { fft: [0, 0, 0, 0, 0, 0, 0, 0], bins: 8 };
      expect(AudioBridge.getBinCount()).toBe(8);
    });
  });

  describe('setBinCount', () => {
    it('returns false when bridge not active', () => {
      expect(AudioBridge.setBinCount(8)).toBe(false);
    });

    it('returns false when setBins method missing', () => {
      (window as any).a = { fft: [0, 0, 0, 0] };
      expect(AudioBridge.setBinCount(8)).toBe(false);
    });

    it('calls setBins and returns true when bridge active', () => {
      const mockSetBins = vi.fn();
      (window as any).a = { fft: [0, 0, 0, 0], setBins: mockSetBins };

      const result = AudioBridge.setBinCount(8);

      expect(result).toBe(true);
      expect(mockSetBins).toHaveBeenCalledWith(8);
      expect(mockSetBins).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateFFT', () => {
    it('returns false when bridge not active', () => {
      expect(AudioBridge.updateFFT()).toBe(false);
    });

    it('returns false when tick method missing', () => {
      (window as any).a = { fft: [0, 0, 0, 0] };
      expect(AudioBridge.updateFFT()).toBe(false);
    });

    it('calls tick and returns true when bridge active', () => {
      const mockTick = vi.fn();
      (window as any).a = { fft: [0, 0, 0, 0], tick: mockTick };

      const result = AudioBridge.updateFFT();

      expect(result).toBe(true);
      expect(mockTick).toHaveBeenCalled();
      expect(mockTick).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnectBridge', () => {
    it('returns false when bridge not active', () => {
      expect(AudioBridge.disconnectBridge()).toBe(false);
    });

    it('returns false when disconnect method missing', () => {
      (window as any).a = { fft: [0, 0, 0, 0] };
      expect(AudioBridge.disconnectBridge()).toBe(false);
    });

    it('calls disconnect, removes window.a, and returns true', () => {
      const mockDisconnect = vi.fn();
      (window as any).a = { fft: [0, 0, 0, 0], disconnect: mockDisconnect };

      const result = AudioBridge.disconnectBridge();

      expect(result).toBe(true);
      expect(mockDisconnect).toHaveBeenCalled();
      expect((window as any).a).toBeUndefined();
    });
  });

  describe('getBridgeInstance', () => {
    it('returns undefined when bridge not initialized', () => {
      expect(AudioBridge.getBridgeInstance()).toBeUndefined();
    });

    it('returns bridge instance when initialized', () => {
      const mockBridge: Partial<HydraBridge> = {
        fft: [0.5, 0.3, 0.2, 0.1],
        bins: 4
      };
      (window as any).a = mockBridge;
      expect(AudioBridge.getBridgeInstance()).toBe(mockBridge);
    });
  });
});
