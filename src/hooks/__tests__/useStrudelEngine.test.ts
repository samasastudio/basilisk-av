import { initHydra } from '@strudel/hydra';
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

vi.mock('@strudel/hydra', () => ({
  initHydra: vi.fn(),
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
    expect(result.current.hydraError).toBe(null);
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

  // Hydra auto-initialization tests
  describe('Hydra auto-initialization', () => {
    it('calls initHydra during startEngine after REPL init', async () => {
      const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
      vi.mocked(initStrudel).mockResolvedValue(mockRepl);
      vi.mocked(initHydra).mockResolvedValue(undefined);

      const { result } = renderHook(() => useStrudelEngine());

      await act(async () => {
        await result.current.startEngine();
      });

      expect(initHydra).toHaveBeenCalled();
      expect(result.current.engineInitialized).toBe(true);
    });

    it('calls initHydra with correct window dimensions', async () => {
      const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
      vi.mocked(initStrudel).mockResolvedValue(mockRepl);
      vi.mocked(initHydra).mockResolvedValue(undefined);

      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });

      const { result } = renderHook(() => useStrudelEngine());

      await act(async () => {
        await result.current.startEngine();
      });

      expect(initHydra).toHaveBeenCalledWith({
        width: 1920,
        height: 1080
      });
    });

    it('handles Hydra init error gracefully and still reaches ready state', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
      vi.mocked(initStrudel).mockResolvedValue(mockRepl);
      vi.mocked(initHydra).mockRejectedValue(new Error('WebGL not supported'));

      const { result } = renderHook(() => useStrudelEngine());

      await act(async () => {
        await result.current.startEngine();
      });

      // Engine should still be ready even if Hydra failed
      expect(result.current.engineInitialized).toBe(true);
      expect(result.current.hydraError).toBe('Hydra failed to initialize: WebGL not supported');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Hydra initialization failed, audio-only mode:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('sets hydraError state with user-friendly message on failure', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
      vi.mocked(initStrudel).mockResolvedValue(mockRepl);
      vi.mocked(initHydra).mockRejectedValue(new Error('Canvas context lost'));

      const { result } = renderHook(() => useStrudelEngine());

      await act(async () => {
        await result.current.startEngine();
      });

      expect(result.current.hydraError).toBe('Hydra failed to initialize: Canvas context lost');
    });

    it('does not call initHydra if engine already initialized', async () => {
      const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
      vi.mocked(initStrudel).mockResolvedValue(mockRepl);
      vi.mocked(initHydra).mockResolvedValue(undefined);

      const { result } = renderHook(() => useStrudelEngine());

      // First initialization
      await act(async () => {
        await result.current.startEngine();
      });

      expect(initHydra).toHaveBeenCalledTimes(1);

      // Try to initialize again
      await act(async () => {
        await result.current.startEngine();
      });

      // Should not call initHydra again
      expect(initHydra).toHaveBeenCalledTimes(1);
    });

    it('clears hydraError at start of new initialization attempt', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };

      // First: Strudel fails (so engine status becomes 'error', allowing retry)
      vi.mocked(initStrudel).mockRejectedValueOnce(new Error('Strudel error'));

      const { result } = renderHook(() => useStrudelEngine());

      await act(async () => {
        await result.current.startEngine();
      });

      expect(result.current.initError).toBe('Strudel error');
      expect(result.current.engineStatus).toBe('error');

      // Reset error to allow retry
      act(() => {
        result.current.resetError();
      });

      expect(result.current.engineStatus).toBe('idle');

      // Second: Both succeed - hydraError should be cleared at start
      vi.mocked(initStrudel).mockResolvedValueOnce(mockRepl);
      vi.mocked(initHydra).mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.startEngine();
      });

      // Both initError and hydraError should be null after successful init
      expect(result.current.initError).toBe(null);
      expect(result.current.hydraError).toBe(null);
      expect(result.current.engineInitialized).toBe(true);
    });
  });
});
