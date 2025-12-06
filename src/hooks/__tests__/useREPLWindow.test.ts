import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  createDragData,
  createDragEvent,
  createResizeEvent,
  createResizeDelta,
  createResizeRef,
  DEFAULT_RESIZE_DIRECTION,
} from '../../test/mocks';
import { useREPLWindow } from '../useREPLWindow';


describe('useREPLWindow', () => {
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Clear localStorage to prevent test pollution from usePersistedState
    localStorage.clear();

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
        createDragEvent(),
        createDragData({ x: 100, y: 200 })
      );
    });

    expect(result.current.position).toEqual({ x: 100, y: 200 });
  });

  it('updates size when handleResizeStop is called', () => {
    const { result } = renderHook(() => useREPLWindow());

    act(() => {
      result.current.handleResizeStop(
        createResizeEvent(),
        DEFAULT_RESIZE_DIRECTION,
        createResizeRef('800px', '500px'),
        createResizeDelta(),
        { x: 50, y: 60 }
      );
    });

    expect(result.current.size).toEqual({ width: 800, height: 500 });
    expect(result.current.position).toEqual({ x: 50, y: 60 });
  });

  it('handles resize with non-integer dimensions', () => {
    const { result } = renderHook(() => useREPLWindow());

    act(() => {
      result.current.handleResizeStop(
        createResizeEvent(),
        DEFAULT_RESIZE_DIRECTION,
        createResizeRef('750.5px', '450.75px'),
        createResizeDelta(),
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
      result.current.handleDragStop(
        createDragEvent(),
        createDragData({ x: 200, y: 300 })
      );
    });

    expect(result.current.position).toEqual({ x: 200, y: 300 });
    expect(result.current.size).toEqual({ width: 600, height: 400 }); // unchanged

    // Change size
    act(() => {
      result.current.handleResizeStop(
        createResizeEvent(),
        DEFAULT_RESIZE_DIRECTION,
        createResizeRef('700px', '500px'),
        createResizeDelta(),
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
