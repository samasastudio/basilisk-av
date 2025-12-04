import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia (used by some UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.requestAnimationFrame (used by HUD animation)
// Don't call the callback immediately to avoid infinite loops in tests
global.requestAnimationFrame = vi.fn(() => 0);

global.cancelAnimationFrame = vi.fn();

// Mock AudioNode (used by patchSuperdough)
class MockAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

// Set up the prototype with mocked methods
MockAudioNode.prototype.connect = vi.fn();
MockAudioNode.prototype.disconnect = vi.fn();

// @ts-expect-error - Assigning mock class to global AudioNode for testing
global.AudioNode = MockAudioNode;

// Mock AudioContext (used by audio bridge)
global.AudioContext = vi.fn().mockImplementation(() => ({
  createAnalyser: vi.fn(() => ({
    fftSize: 1024,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 512,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getByteFrequencyData: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { value: 1.0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  destination: {},
  close: vi.fn(),
  resume: vi.fn(),
  suspend: vi.fn(),
  state: 'running',
  // @ts-expect-error - Mock implementation doesn't match full AudioContext interface
}));
