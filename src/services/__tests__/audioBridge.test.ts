import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as AudioBridge from '../audioBridge';

import type { HydraBridge } from '../audioBridge';

describe('audioBridge service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.a;
  });

  describe('isBridgeActive', () => {
    it('returns false when bridge not initialized', () => {
      expect(AudioBridge.isBridgeActive()).toBe(false);
    });

    it('returns false when window.a exists but no fft', () => {
      window.a = {} as HydraBridge;
      expect(AudioBridge.isBridgeActive()).toBe(false);
    });

    it('returns true when bridge initialized with fft', () => {
      window.a = { fft: [0.5, 0.3, 0.2, 0.1] } as HydraBridge;
      expect(AudioBridge.isBridgeActive()).toBe(true);
    });
  });

  describe('getBridgeFFT', () => {
    it('returns 0 when bridge not active', () => {
      expect(AudioBridge.getBridgeFFT(0)).toBe(0);
    });

    it('returns 0 when index is undefined', () => {
      window.a = { fft: [0.5, 0.3, 0.2, 0.1] } as HydraBridge;
      expect(AudioBridge.getBridgeFFT(10)).toBe(0);
    });

    it('returns FFT value for valid index', () => {
      window.a = { fft: [0.5, 0.3, 0.2, 0.1] } as HydraBridge;
      expect(AudioBridge.getBridgeFFT(0)).toBe(0.5);
      expect(AudioBridge.getBridgeFFT(2)).toBe(0.2);
      expect(AudioBridge.getBridgeFFT(3)).toBe(0.1);
    });

    it('defaults to index 0 when no argument provided', () => {
      window.a = { fft: [0.7, 0.3, 0.2, 0.1] } as HydraBridge;
      expect(AudioBridge.getBridgeFFT()).toBe(0.7);
    });

    it('returns 0 for out of bounds index', () => {
      window.a = { fft: [0.5, 0.3] } as HydraBridge;
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
      window.a = { fft: fftData } as HydraBridge;
      expect(AudioBridge.getAllFFT()).toEqual(fftData);
    });

    it('returns reference to actual array', () => {
      const fftData = [0.5, 0.3, 0.2, 0.1];
      window.a = { fft: fftData } as HydraBridge;
      const result = AudioBridge.getAllFFT();
      expect(result).toBe(fftData); // Same reference
    });
  });

  describe('getBinCount', () => {
    it('returns 0 when bridge not active', () => {
      expect(AudioBridge.getBinCount()).toBe(0);
    });

    it('returns bin count when bridge active', () => {
      window.a = { fft: [0, 0, 0, 0], bins: 4 } as HydraBridge;
      expect(AudioBridge.getBinCount()).toBe(4);
    });

    it('returns correct bin count for different sizes', () => {
      window.a = { fft: [0, 0, 0, 0, 0, 0, 0, 0], bins: 8 } as HydraBridge;
      expect(AudioBridge.getBinCount()).toBe(8);
    });
  });

  describe('setBinCount', () => {
    it('returns false when bridge not active', () => {
      expect(AudioBridge.setBinCount(8)).toBe(false);
    });

    it('returns false when setBins method missing', () => {
      window.a = { fft: [0, 0, 0, 0] } as HydraBridge;
      expect(AudioBridge.setBinCount(8)).toBe(false);
    });

    it('calls setBins and returns true when bridge active', () => {
      const mockSetBins = vi.fn();
      window.a = { fft: [0, 0, 0, 0], setBins: mockSetBins } as HydraBridge;

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
      window.a = { fft: [0, 0, 0, 0] } as HydraBridge;
      expect(AudioBridge.updateFFT()).toBe(false);
    });

    it('calls tick and returns true when bridge active', () => {
      const mockTick = vi.fn();
      window.a = { fft: [0, 0, 0, 0], tick: mockTick } as HydraBridge;

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
      window.a = { fft: [0, 0, 0, 0] } as HydraBridge;
      expect(AudioBridge.disconnectBridge()).toBe(false);
    });

    it('calls disconnect, removes window.a, and returns true', () => {
      const mockDisconnect = vi.fn();
      window.a = { fft: [0, 0, 0, 0], disconnect: mockDisconnect } as HydraBridge;

      const result = AudioBridge.disconnectBridge();

      expect(result).toBe(true);
      expect(mockDisconnect).toHaveBeenCalled();
      expect(window.a).toBeUndefined();
    });
  });

  describe('getBridgeInstance', () => {
    it('returns undefined when bridge not initialized', () => {
      expect(AudioBridge.getBridgeInstance()).toBeUndefined();
    });

    it('returns bridge instance when initialized', () => {
      const mockBridge = {
        fft: [0.5, 0.3, 0.2, 0.1],
        bins: 4
      } as HydraBridge;
      window.a = mockBridge;
      expect(AudioBridge.getBridgeInstance()).toBe(mockBridge);
    });
  });
});
