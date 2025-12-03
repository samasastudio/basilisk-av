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
});
