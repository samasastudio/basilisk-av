import { useState, useEffect } from 'react';
import type { DraggableData, ResizableDelta, Position } from 'react-rnd';

// Default REPL window constraints
const DEFAULT_MIN_WIDTH = 400;
const DEFAULT_MIN_HEIGHT = 300;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_MARGIN = 16;

// Calculate offset to position window near bottom (height + margin)
const BOTTOM_OFFSET = DEFAULT_HEIGHT + DEFAULT_MARGIN;

interface WindowBounds {
  minWidth: number;
  minHeight: number;
  maxWidth: string;
  maxHeight: string;
}

/**
 * Calculate responsive bounds based on current viewport size
 */
function calculateBounds(): WindowBounds {
  if (typeof window === 'undefined') {
    return {
      minWidth: DEFAULT_MIN_WIDTH,
      minHeight: DEFAULT_MIN_HEIGHT,
      maxWidth: '90vw',
      maxHeight: '90vh',
    };
  }

  return {
    minWidth: DEFAULT_MIN_WIDTH,
    minHeight: DEFAULT_MIN_HEIGHT,
    maxWidth: '90vw',
    maxHeight: '90vh',
  };
}

/**
 * Hook for managing REPL window position, size, and bounds.
 * Handles drag and resize interactions for the floating REPL panel.
 * Automatically updates bounds when the browser window is resized.
 *
 * @returns Object containing position, size, bounds, and event handlers
 */
export function useREPLWindow() {
  // Calculate initial Y position to place window near bottom of screen
  const initialY = typeof window !== 'undefined' ? window.innerHeight - BOTTOM_OFFSET : 300;

  const [position, setPosition] = useState<Position>({ x: DEFAULT_MARGIN, y: initialY });
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [bounds, setBounds] = useState<WindowBounds>(calculateBounds);

  // Update bounds when window is resized
  useEffect(() => {
    const handleWindowResize = () => {
      setBounds(calculateBounds());
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  /**
   * Handle drag stop event from react-rnd
   */
  const handleDragStop = (_e: any, d: DraggableData) => {
    setPosition({ x: d.x, y: d.y });
  };

  /**
   * Handle resize stop event from react-rnd
   */
  const handleResizeStop = (
    _e: any,
    _direction: any,
    ref: HTMLElement,
    _delta: ResizableDelta,
    position: Position
  ) => {
    setSize({
      width: parseInt(ref.style.width),
      height: parseInt(ref.style.height),
    });
    setPosition(position);
  };

  return {
    position,
    size,
    bounds,
    handleDragStop,
    handleResizeStop,
  };
}
