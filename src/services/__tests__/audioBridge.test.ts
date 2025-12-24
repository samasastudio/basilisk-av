import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as AudioBridge from '../audioBridge';

import type { HydraBridge } from '../audioBridge';

// Mock Web Audio API
const createMockAudioContext = () => {
  const mockAnalyser = {
    fftSize: 0,
    smoothingTimeConstant: 0,
    frequencyBinCount: 512,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as AnalyserNode;

  const mockGainNode = {
    gain: { value: 1.0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as GainNode;

  const mockDestination = {} as AudioDestinationNode;

  return {
    createAnalyser: vi.fn(() => mockAnalyser),
    createGain: vi.fn(() => mockGainNode),
    destination: mockDestination,
    mockAnalyser,
    mockGainNode,
  } as unknown as AudioContext & {
    mockAnalyser: typeof mockAnalyser;
    mockGainNode: typeof mockGainNode;
  };
};

describe('audioBridge service', () => {
  let rafCallbacks: FrameRequestCallback[] = [];
  let rafId = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    delete window.a;
    rafCallbacks = [];
    rafId = 0;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return ++rafId;
    });
  });

  afterEach(() => {
    // Clean up any lingering RAF callbacks
    rafCallbacks = [];
  });

  describe('initHydraBridge', () => {
    it('returns null when AudioContext is not provided', () => {
      const result = AudioBridge.initHydraBridge(null as unknown as AudioContext);
      expect(result).toBeNull();
      expect(window.a).toBeUndefined();
    });

    it('creates and returns a valid HydraBridge instance', () => {
      const mockContext = createMockAudioContext();
      const bridge = AudioBridge.initHydraBridge(mockContext);

      expect(bridge).not.toBeNull();
      expect(bridge?.analyser).toBe(mockContext.mockAnalyser);
      expect(bridge?.gainNode).toBe(mockContext.mockGainNode);
      expect(bridge?.fft).toEqual([0, 0, 0, 0]); // Default 4 bins
      expect(bridge?.bins).toBe(4);
      expect(typeof bridge?.tick).toBe('function');
      expect(typeof bridge?.setBins).toBe('function');
      expect(typeof bridge?.disconnect).toBe('function');
    });

    it('configures analyser with correct settings', () => {
      const mockContext = createMockAudioContext();
      AudioBridge.initHydraBridge(mockContext);

      expect(mockContext.mockAnalyser.fftSize).toBe(1024);
      expect(mockContext.mockAnalyser.smoothingTimeConstant).toBe(0.8);
    });

    it('configures gain node with correct settings', () => {
      const mockContext = createMockAudioContext();
      AudioBridge.initHydraBridge(mockContext);

      expect(mockContext.mockGainNode.gain.value).toBe(1.0);
    });

    it('connects audio graph correctly: gainNode → analyser → destination', () => {
      const mockContext = createMockAudioContext();
      AudioBridge.initHydraBridge(mockContext);

      expect(mockContext.mockGainNode.connect).toHaveBeenCalledWith(mockContext.mockAnalyser);
      expect(mockContext.mockAnalyser.connect).toHaveBeenCalledWith(mockContext.destination);
    });

    it('exposes bridge globally as window.a', () => {
      const mockContext = createMockAudioContext();
      const bridge = AudioBridge.initHydraBridge(mockContext);

      expect(window.a).toBe(bridge);
      expect(window.a?.fft).toBeDefined();
    });

    it('starts continuous tick loop with requestAnimationFrame', () => {
      const mockContext = createMockAudioContext();
      AudioBridge.initHydraBridge(mockContext);

      expect(requestAnimationFrame).toHaveBeenCalled();
      expect(rafCallbacks.length).toBeGreaterThan(0);
    });

    it('tick() updates FFT data from analyser', () => {
      const mockContext = createMockAudioContext();
      const bridge = AudioBridge.initHydraBridge(mockContext);

      // Mock analyser data (simulating audio input)
      const mockFFTData = new Uint8Array(512).fill(128); // Mid-range values
      const mockImplementation = (array: Uint8Array): void => {
        array.set(mockFFTData);
      };
      (mockContext.mockAnalyser.getByteFrequencyData as any).mockImplementation(mockImplementation);

      // Call tick manually
      bridge?.tick();

      expect(mockContext.mockAnalyser.getByteFrequencyData).toHaveBeenCalled();
      expect(bridge?.fft.length).toBe(4); // Default bins
      // All values should be ~0.5 (128/255)
      const checkValue = (val: number): void => {
        expect(val).toBeCloseTo(0.5, 1);
      };
      bridge?.fft.forEach(checkValue);
    });

    it('tick() skips FFT updates when testMode is enabled', () => {
      const mockContext = createMockAudioContext();
      const bridge = AudioBridge.initHydraBridge(mockContext);

      // Clear any RAF calls from initialization
      (mockContext.mockAnalyser.getByteFrequencyData as any).mockClear();

      // Enable test mode
      if (bridge) bridge.testMode = true;

      // Manually set FFT data
      if (bridge) bridge.fft = [0.9, 0.8, 0.7, 0.6];

      // Call tick manually - should NOT update FFT when testMode is true
      bridge?.tick();

      expect(mockContext.mockAnalyser.getByteFrequencyData).not.toHaveBeenCalled();
      expect(bridge?.fft).toEqual([0.9, 0.8, 0.7, 0.6]); // Unchanged
    });

    it('setBins() changes bin count and reinitializes FFT array', () => {
      const mockContext = createMockAudioContext();
      const bridge = AudioBridge.initHydraBridge(mockContext);

      expect(bridge?.bins).toBe(4);
      expect(bridge?.fft.length).toBe(4);

      bridge?.setBins(8);

      expect(bridge?.bins).toBe(8);
      expect(bridge?.fft.length).toBe(8);
      expect(bridge?.fft).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it('disconnect() disconnects audio nodes and cleans up window.a', () => {
      const mockContext = createMockAudioContext();
      const bridge = AudioBridge.initHydraBridge(mockContext);

      expect(window.a).toBeDefined();

      bridge?.disconnect();

      expect(mockContext.mockGainNode.disconnect).toHaveBeenCalled();
      expect(mockContext.mockAnalyser.disconnect).toHaveBeenCalled();
      // Note: window.a is cleaned up via disconnectBridge(), not initHydraBridge
    });
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
      window.a = { fft: [0, 0, 0, 0], setBins: mockSetBins } as unknown as HydraBridge;

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
      window.a = { fft: [0, 0, 0, 0] } as unknown as HydraBridge;
      expect(AudioBridge.updateFFT()).toBe(false);
    });

    it('calls tick and returns true when bridge active', () => {
      const mockTick = vi.fn();
      window.a = { fft: [0, 0, 0, 0], tick: mockTick } as unknown as HydraBridge;

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
      window.a = { fft: [0, 0, 0, 0], disconnect: mockDisconnect } as unknown as HydraBridge;

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
