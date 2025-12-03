import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useREPLWindow } from '../useREPLWindow';

describe('useREPLWindow', () => {
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Set a consistent window height for tests
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    // Restore original window height
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it('returns initial position and size', () => {
    const { result } = renderHook(() => useREPLWindow());

    expect(result.current.position).toEqual({ x: 16, y: 384 }); // 800 - 416
    expect(result.current.size).toEqual({ width: 600, height: 400 });
  });

  it('provides drag and resize handlers', () => {
    const { result } = renderHook(() => useREPLWindow());

    expect(result.current.handleDragStop).toBeInstanceOf(Function);
    expect(result.current.handleResizeStop).toBeInstanceOf(Function);
  });

  it('updates position when handleDragStop is called', () => {
    const { result } = renderHook(() => useREPLWindow());

    act(() => {
      result.current.handleDragStop(
        {} as any, // event (not used)
        { x: 100, y: 200 } as any // drag data
      );
    });

    expect(result.current.position).toEqual({ x: 100, y: 200 });
  });

  it('updates size when handleResizeStop is called', () => {
    const { result } = renderHook(() => useREPLWindow());

    const mockRef = {
      style: {
        width: '800px',
        height: '500px',
      },
    };

    act(() => {
      result.current.handleResizeStop(
        {} as any, // event
        'bottomRight' as any, // direction
        mockRef as any, // ref with style
        {} as any, // delta
        { x: 50, y: 60 } // new position
      );
    });

    expect(result.current.size).toEqual({ width: 800, height: 500 });
    expect(result.current.position).toEqual({ x: 50, y: 60 });
  });

  it('handles resize with non-integer dimensions', () => {
    const { result } = renderHook(() => useREPLWindow());

    const mockRef = {
      style: {
        width: '750.5px',
        height: '450.75px',
      },
    };

    act(() => {
      result.current.handleResizeStop(
        {} as any,
        'bottomRight' as any,
        mockRef as any,
        {} as any,
        { x: 20, y: 30 }
      );
    });

    // parseInt should round down
    expect(result.current.size).toEqual({ width: 750, height: 450 });
  });

  it('maintains independent position and size state', () => {
    const { result } = renderHook(() => useREPLWindow());

    // Change position
    act(() => {
      result.current.handleDragStop({} as any, { x: 200, y: 300 } as any);
    });

    expect(result.current.position).toEqual({ x: 200, y: 300 });
    expect(result.current.size).toEqual({ width: 600, height: 400 }); // unchanged

    // Change size
    const mockRef = { style: { width: '700px', height: '500px' } };
    act(() => {
      result.current.handleResizeStop(
        {} as any,
        'bottomRight' as any,
        mockRef as any,
        {} as any,
        { x: 200, y: 300 }
      );
    });

    expect(result.current.size).toEqual({ width: 700, height: 500 });
    expect(result.current.position).toEqual({ x: 200, y: 300 });
  });

  it('calculates initial Y position based on window height', () => {
    // Change window height
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });

    const { result } = renderHook(() => useREPLWindow());

    // Y should be 1000 - 416 = 584
    expect(result.current.position.y).toBe(584);
  });

  it('enforces minimum Y position on small viewports', () => {
    // Set a very small window height
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 200, // Too small for normal positioning
    });

    const { result } = renderHook(() => useREPLWindow());

    // Should be clamped to minimum (48px for header)
    // Instead of 200 - 416 = -216 (off-screen)
    expect(result.current.position.y).toBe(48);
  });

  it('returns static bounds configuration with viewport units', () => {
    const { result } = renderHook(() => useREPLWindow());

    expect(result.current.bounds).toEqual({
      minWidth: 400,
      minHeight: 300,
      maxWidth: '90vw',
      maxHeight: '90vh',
    });
  });

  it('bounds remain static across re-renders', () => {
    const { result, rerender } = renderHook(() => useREPLWindow());

    const initialBounds = result.current.bounds;

    // Re-render the hook
    rerender();

    // Bounds should be the exact same reference (not recreated)
    expect(result.current.bounds).toBe(initialBounds);
  });

  it('uses viewport units for automatic responsiveness', () => {
    const { result } = renderHook(() => useREPLWindow());

    // Viewport units (vw/vh) are handled by browser/Rnd automatically
    // No need for resize listeners or reactive state
    expect(result.current.bounds.maxWidth).toBe('90vw');
    expect(result.current.bounds.maxHeight).toBe('90vh');
    expect(typeof result.current.bounds.maxWidth).toBe('string');
    expect(typeof result.current.bounds.maxHeight).toBe('string');
  });
});
