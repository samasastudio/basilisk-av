import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStrudelEngine } from '../useStrudelEngine';
import { initStrudel } from '@strudel/web';
import { setBridgeInitializer } from '../../utils/patchSuperdough';

// Mock dependencies
vi.mock('@strudel/web', () => ({
  initStrudel: vi.fn(),
}));

vi.mock('../../utils/patchSuperdough', () => ({
  setBridgeInitializer: vi.fn(),
}));

// Mock window.samples
beforeEach(() => {
  (window as any).samples = vi.fn((path: string) => `samples:${path}`);
  (window as any).repl = undefined;
  vi.clearAllMocks();
});

describe('useStrudelEngine', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useStrudelEngine());

    expect(result.current.engineInitialized).toBe(false);
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.hydraLinked).toBe(false);
    expect(result.current.hydraStatus).toBe('none');
    expect(result.current.startEngine).toBeInstanceOf(Function);
    expect(result.current.playTestPattern).toBeInstanceOf(Function);
    expect(result.current.hushAudio).toBeInstanceOf(Function);
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
    });

    // Verify prebake function calls window.samples
    const prebakeFunction = vi.mocked(initStrudel).mock.calls[0][0].prebake;
    const prebakeResult = prebakeFunction();
    expect((window as any).samples).toHaveBeenCalledWith('github:tidalcycles/dirt-samples');
    expect(prebakeResult).toBe('samples:github:tidalcycles/dirt-samples');
  });

  it('sets window.repl after successful initialization', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    vi.mocked(initStrudel).mockResolvedValue(mockRepl);

    const { result } = renderHook(() => useStrudelEngine());

    await act(async () => {
      await result.current.startEngine();
    });

    expect((window as any).repl).toBe(mockRepl);
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
    expect((window as any).replAudio).toBe(mockAudioContext);
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

    // Should log error and alert user
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize Strudel engine:', error);
    expect(alertSpy).toHaveBeenCalledWith('Failed to initialize audio engine. Check console for details.');

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('prevents multiple simultaneous initializations', async () => {
    const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
    vi.mocked(initStrudel).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(mockRepl), 100))
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
});
