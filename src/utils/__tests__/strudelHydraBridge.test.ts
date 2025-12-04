import { describe, it, expect, vi, beforeEach } from 'vitest';

import { initHydraBridge } from '../strudelHydraBridge';

// Mock frequency data filler
function fillMockFrequencyData(dataArray: Uint8Array): void {
  for (let i = 0; i < dataArray.length; i++) {
    // eslint-disable-next-line no-param-reassign
    dataArray[i] = Math.floor(Math.random() * 255);
  }
}

// Mock AudioContext type for testing
interface MockAnalyserNode {
  fftSize: number;
  smoothingTimeConstant: number;
  frequencyBinCount: number;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  getByteFrequencyData: ReturnType<typeof vi.fn>;
}

interface MockGainNode {
  gain: { value: number };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

interface MockAudioContext {
  createAnalyser: ReturnType<typeof vi.fn<[], MockAnalyserNode>>;
  createGain: ReturnType<typeof vi.fn<[], MockGainNode>>;
  destination: Record<string, never>;
}

describe('strudelHydraBridge', () => {
  let mockAudioContext: MockAudioContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock AudioContext
    mockAudioContext = {
      createAnalyser: vi.fn(() => ({
        fftSize: 0,
        smoothingTimeConstant: 0,
        frequencyBinCount: 512,
        connect: vi.fn(),
        disconnect: vi.fn(),
        getByteFrequencyData: vi.fn(fillMockFrequencyData),
      })),
      createGain: vi.fn(() => ({
        gain: { value: 1.0 },
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      destination: {},
    };

    // Clear window.a from previous tests
    delete window.a;
  });

  it('creates bridge with analyser and gain nodes', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    expect(bridge).not.toBeNull();
    expect(bridge?.analyser).toBeDefined();
    expect(bridge?.gainNode).toBeDefined();
  });

  it('exposes bridge globally as window.a', () => {
    initHydraBridge(mockAudioContext as unknown as AudioContext);

    expect(window.a).toBeDefined();
    expect(window.a?.fft).toBeDefined();
  });

  it('initializes with 4 FFT bins by default', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    expect(bridge?.bins).toBe(4);
    expect(bridge?.fft).toHaveLength(4);
  });

  it('sets correct analyser configuration', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    expect(bridge?.analyser.fftSize).toBe(1024);
    expect(bridge?.analyser.smoothingTimeConstant).toBe(0.8);
  });

  it('sets correct gain configuration', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    expect(bridge?.gainNode.gain.value).toBe(1.0);
  });

  it('connects gain node to analyser', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    expect(bridge?.gainNode.connect).toHaveBeenCalledWith(bridge?.analyser);
  });

  it('connects analyser to destination', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    expect(bridge?.analyser.connect).toHaveBeenCalledWith(mockAudioContext.destination);
  });

  it('returns null when audioContext is not provided', () => {
    const bridge = initHydraBridge(null as unknown as AudioContext);

    expect(bridge).toBeNull();
  });

  it('allows changing number of bins', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    bridge?.setBins(8);

    expect(bridge?.bins).toBe(8);
    expect(bridge?.fft).toHaveLength(8);
  });

  it('tick method updates FFT values', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    // Manually call tick (in real app, this is called by requestAnimationFrame)
    bridge?.tick();

    // FFT values should be updated (normalized to 0-1)
    expect(bridge?.fft).toBeDefined();
    expect(bridge?.fft.every((val: number) => val >= 0 && val <= 1)).toBe(true);
  });

  it('disconnect method disconnects audio nodes', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    bridge?.disconnect();

    expect(bridge?.gainNode.disconnect).toHaveBeenCalled();
    expect(bridge?.analyser.disconnect).toHaveBeenCalled();
  });

  it('sets minimum of 1 bin when setBins is called with 0', () => {
    const bridge = initHydraBridge(mockAudioContext as unknown as AudioContext);

    bridge?.setBins(0);

    expect(bridge?.bins).toBe(1);
  });
});
