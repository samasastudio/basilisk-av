import { initStrudel } from '@strudel/web';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { setBridgeInitializer } from '../../utils/patchSuperdough';
import { useStrudelEngine } from '../useStrudelEngine';



// Mock dependencies
vi.mock('@strudel/web', () => ({
  initStrudel: vi.fn(),
  registerWidgetType: vi.fn(),
}));

vi.mock('../../utils/patchSuperdough', () => ({
  setBridgeInitializer: vi.fn(),
}));

// Mock window.samples
beforeEach(() => {
  window.samples = vi.fn((path: string) => Promise.resolve(`samples:${path}`));
  window.repl = undefined;
  vi.clearAllMocks();
});

describe('useStrudelEngine', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useStrudelEngine());

    expect(result.current.engineInitialized).toBe(false);
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.hydraLinked).toBe(false);
    expect(result.current.hydraStatus).toBe('none');
    expect(result.current.initError).toBe(null);
    expect(result.current.startEngine).toBeInstanceOf(Function);
    expect(result.current.playTestPattern).toBeInstanceOf(Function);
    expect(result.current.hushAudio).toBeInstanceOf(Function);
    expect(result.current.resetError).toBeInstanceOf(Function);
  });

  it('starts engine initialization when startEngine is called', async () => {
    const mockRepl = {
      evaluate: vi.fn(),
      stop: vi.fn(),
    };

    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    // Should not be initializing initially
    expect(result.current.isInitializing).toBe(false);

    // Start engine
    act(() => {
      result.current.startEngine();
    });

    // Should be initializing immediately
    expect(result.current.isInitializing).toBe(true);
    expect(result.current.engineInitialized).toBe(false);

    // Wait for initialization to complete
    await waitFor(() => {
      expect(result.current.engineInitialized).toBe(true);
    });

    // Should no longer be initializing
    expect(result.current.isInitializing).toBe(false);
  });

  it('calls initStrudel with correct configuration', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    await act(async () => {
      await result.current.startEngine();
    });

    expect(initStrudel).toHaveBeenCalledWith({
      prebake: expect.any(Function),
      onUpdateState: expect.any(Function),
    });

    // Verify prebake function calls window.samples
    const prebakeFunction = vi.mocked(initStrudel).mock.calls[0][0].prebake;
    const prebakeResult = await prebakeFunction();
    expect(window.samples).toHaveBeenCalledWith('github:tidalcycles/dirt-samples');
    expect(prebakeResult).toBe('samples:github:tidalcycles/dirt-samples');
  });

  it('sets window.repl after successful initialization', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    await act(async () => {
      await result.current.startEngine();
    });

    expect(window.repl).toBe(mockRepl);
  });

  it('registers bridge initializer callback', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    await act(async () => {
      await result.current.startEngine();
    });

    expect(setBridgeInitializer).toHaveBeenCalledWith(expect.any(Function));
  });

  it('updates hydra state when bridge initializer is called', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    const mockAudioContext = { destination: {} } as AudioContext;

    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    let bridgeCallback: ((ctx: AudioContext) => void) | undefined;
    vi.mocked(setBridgeInitializer).mockImplementation((callback) => {
      bridgeCallback = callback;
    });

    const { result } = renderHook(() => useStrudelEngine());

    await act(async () => {
      await result.current.startEngine();
    });

    // Initially not linked
    expect(result.current.hydraLinked).toBe(false);
    expect(result.current.hydraStatus).toBe('none');

    // Simulate bridge initialization
    act(() => {
      bridgeCallback?.(mockAudioContext);
    });

    // Should now be linked
    expect(result.current.hydraLinked).toBe(true);
    expect(result.current.hydraStatus).toBe('Strudel (a.fft)');
    expect(window.replAudio).toBe(mockAudioContext);
  });

  it('handles initialization errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const error = new Error('Failed to initialize');
    vi.mocked(initStrudel).mockRejectedValue(error);

    const { result } = renderHook(() => useStrudelEngine());

    await act(async () => {
      await result.current.startEngine();
    });

    // Should not be initialized
    expect(result.current.engineInitialized).toBe(false);
    expect(result.current.isInitializing).toBe(false);

    // Should capture error message
    expect(result.current.initError).toBe('Failed to initialize');

    // Should log error and alert user
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize Strudel engine:', error);
    expect(alertSpy).toHaveBeenCalledWith('Failed to initialize audio engine. Check console for details.');

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('prevents multiple simultaneous initializations', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    const delayedResolve = (resolve: (value: typeof mockRepl) => void): void => {
      setTimeout(() => resolve(mockRepl), 100);
    };
    vi.mocked(initStrudel).mockImplementation(() =>
      new Promise(delayedResolve)
    );

    const { result } = renderHook(() => useStrudelEngine());

    // Start first initialization
    act(() => {
      result.current.startEngine();
    });

    expect(result.current.isInitializing).toBe(true);

    // Try to start again while initializing
    act(() => {
      result.current.startEngine();
    });

    // Should only call initStrudel once
    expect(initStrudel).toHaveBeenCalledTimes(1);
  });

  it('prevents re-initialization when already initialized', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    // First initialization
    await act(async () => {
      await result.current.startEngine();
    });

    expect(result.current.engineInitialized).toBe(true);
    expect(initStrudel).toHaveBeenCalledTimes(1);

    // Try to initialize again
    await act(async () => {
      await result.current.startEngine();
    });

    // Should not call initStrudel again
    expect(initStrudel).toHaveBeenCalledTimes(1);
  });

  it('playTestPattern evaluates test pattern when repl is ready', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    // Initialize engine
    await act(async () => {
      await result.current.startEngine();
    });

    // Play test pattern
    act(() => {
      result.current.playTestPattern();
    });

    expect(mockRepl.evaluate).toHaveBeenCalledWith('s("bd*4").gain(0.8)');
  });

  it('playTestPattern does nothing when repl is not initialized', () => {
    const { result } = renderHook(() => useStrudelEngine());

    // Try to play pattern before initialization
    act(() => {
      result.current.playTestPattern();
    });

    // Should not throw or crash
    expect(result.current.engineInitialized).toBe(false);
  });

  it('playTestPattern does nothing when repl has no evaluate method', async () => {
    const mockRepl = { stop: vi.fn() }; // No evaluate method
    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    await act(async () => {
      await result.current.startEngine();
    });

    // Should not throw
    act(() => {
      result.current.playTestPattern();
    });
  });

  it('hushAudio stops playback when repl is ready', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    // Initialize engine
    await act(async () => {
      await result.current.startEngine();
    });

    // Hush audio
    act(() => {
      result.current.hushAudio();
    });

    expect(mockRepl.stop).toHaveBeenCalled();
  });

  it('hushAudio does nothing when repl is not initialized', () => {
    const { result } = renderHook(() => useStrudelEngine());

    // Try to hush before initialization
    act(() => {
      result.current.hushAudio();
    });

    // Should not throw or crash
    expect(result.current.engineInitialized).toBe(false);
  });

  it('hushAudio does nothing when repl has no stop method', async () => {
    const mockRepl = { evaluate: vi.fn() }; // No stop method
    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    await act(async () => {
      await result.current.startEngine();
    });

    // Should not throw
    act(() => {
      result.current.hushAudio();
    });
  });

  it('resetError clears error state and allows retry', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const error = new Error('Network error');
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };

    // First attempt fails
    vi.mocked(initStrudel).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useStrudelEngine());

    // Initial failure
    await act(async () => {
      await result.current.startEngine();
    });

    expect(result.current.initError).toBe('Network error');
    expect(result.current.engineInitialized).toBe(false);

    // Reset error
    act(() => {
      result.current.resetError();
    });

    expect(result.current.initError).toBe(null);

    // Second attempt succeeds
    vi.mocked(initStrudel).mockResolvedValueOnce(mockRepl);

    await act(async () => {
      await result.current.startEngine();
    });

    expect(result.current.initError).toBe(null);
    expect(result.current.engineInitialized).toBe(true);

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('clears previous error when retrying initialization', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };

    // First attempt fails
    vi.mocked(initStrudel).mockRejectedValueOnce(new Error('First error'));

    const { result } = renderHook(() => useStrudelEngine());

    await act(async () => {
      await result.current.startEngine();
    });

    expect(result.current.initError).toBe('First error');

    // Second attempt succeeds - should clear error automatically
    vi.mocked(initStrudel).mockResolvedValueOnce(mockRepl);

    await act(async () => {
      await result.current.startEngine();
    });

    expect(result.current.initError).toBe(null);
    expect(result.current.engineInitialized).toBe(true);

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
