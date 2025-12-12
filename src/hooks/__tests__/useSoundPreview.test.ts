import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSoundPreview } from '../useSoundPreview';
import * as StrudelEngine from '../../services/strudelEngine';

// Mock StrudelEngine
vi.mock('../../services/strudelEngine', () => ({
  getReplInstance: vi.fn(),
  hushAudio: vi.fn()
}));

describe('useSoundPreview', () => {
  let mockRepl: { evaluate: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockRepl = {
      evaluate: vi.fn(),
      stop: vi.fn()
    };

    vi.mocked(StrudelEngine.getReplInstance).mockReturnValue(mockRepl as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with not playing', () => {
    const { result } = renderHook(() => useSoundPreview());

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentSample).toBeNull();
  });

  it('should preview a sample', () => {
    const { result } = renderHook(() => useSoundPreview());

    act(() => {
      result.current.previewSample('808', 0);
    });

    expect(StrudelEngine.hushAudio).toHaveBeenCalled();
    expect(mockRepl.evaluate).toHaveBeenCalledWith('s("808:0").gain(0.8).once()');
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentSample).toBe('808:0');
  });

  it('should use index 0 by default', () => {
    const { result } = renderHook(() => useSoundPreview());

    act(() => {
      result.current.previewSample('bass1');
    });

    expect(mockRepl.evaluate).toHaveBeenCalledWith('s("bass1:0").gain(0.8).once()');
  });

  it('should auto-clear playing state after timeout', () => {
    const { result } = renderHook(() => useSoundPreview());

    act(() => {
      result.current.previewSample('808', 0);
    });

    expect(result.current.isPlaying).toBe(true);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentSample).toBeNull();
  });

  it('should handle multiple samples in sequence', () => {
    const { result } = renderHook(() => useSoundPreview());

    // Play first sample
    act(() => {
      result.current.previewSample('808', 0);
    });

    expect(result.current.currentSample).toBe('808:0');

    // Play second sample before timeout
    act(() => {
      result.current.previewSample('bass1', 2);
    });

    expect(StrudelEngine.hushAudio).toHaveBeenCalledTimes(2);
    expect(mockRepl.evaluate).toHaveBeenCalledWith('s("bass1:2").gain(0.8).once()');
    expect(result.current.currentSample).toBe('bass1:2');
  });

  it('should handle engine not ready', () => {
    vi.mocked(StrudelEngine.getReplInstance).mockReturnValue(null as any);

    const { result } = renderHook(() => useSoundPreview());

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    act(() => {
      result.current.previewSample('808', 0);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot preview: engine not ready');
    expect(result.current.isPlaying).toBe(false);

    consoleWarnSpy.mockRestore();
  });

  it('should handle evaluate errors', () => {
    mockRepl.evaluate.mockImplementation(() => {
      throw new Error('Evaluation failed');
    });

    const { result } = renderHook(() => useSoundPreview());

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      result.current.previewSample('808', 0);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Preview failed:', expect.any(Error));
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentSample).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should stop preview', () => {
    const { result } = renderHook(() => useSoundPreview());

    // Start playing
    act(() => {
      result.current.previewSample('808', 0);
    });

    expect(result.current.isPlaying).toBe(true);

    // Stop
    act(() => {
      result.current.stopPreview();
    });

    expect(StrudelEngine.hushAudio).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentSample).toBeNull();
  });

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useSoundPreview());

    const initialPreview = result.current.previewSample;
    const initialStop = result.current.stopPreview;

    rerender();

    expect(result.current.previewSample).toBe(initialPreview);
    expect(result.current.stopPreview).toBe(initialStop);
  });
});
