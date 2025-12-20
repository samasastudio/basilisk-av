import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage (used by usePersistedState and related hooks)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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
}));

// Suppress expected console messages in tests to reduce noise
// eslint-disable-next-line no-console
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// List of expected log patterns to suppress
const suppressedPatterns = [
  /🌀 @strudel\/core loaded 🌀/,
  /@strudel\/core was loaded more than once/,
  /\[registerPatternMethods\]/,
  /\[connectVisualizationManager\]/,
  /\[connectAudioAnalyser\]/,
  /\[initializeStrudel\]/,
  /\[VizManager\]/,
  /No AudioContext provided to bridge/,
];

const shouldSuppress = (message: string): boolean => suppressedPatterns.some(pattern => pattern.test(message));

// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-console
console.log = vi.fn((...args: any[]) => {
  const message = args.join(' ');
  if (!shouldSuppress(message)) {
    originalConsoleLog(...args);
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.warn = vi.fn((...args: any[]) => {
  const message = args.join(' ');
  if (!shouldSuppress(message)) {
    originalConsoleWarn(...args);
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.error = vi.fn((...args: any[]) => {
  const message = args.join(' ');
  if (!shouldSuppress(message)) {
    originalConsoleError(...args);
  }
});
