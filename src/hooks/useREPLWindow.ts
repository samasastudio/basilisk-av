import { useMemo } from 'react';

import { usePersistedState } from './usePersistedState';

import type { DraggableData, DraggableEvent, Position, ResizableDelta, ResizeDirection } from 'react-rnd';


// Default REPL window constraints
const DEFAULT_MIN_WIDTH = 400;
const DEFAULT_MIN_HEIGHT = 300;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_MARGIN = 16;

// Estimated height of the sound browser when open
// Includes: padding (12px), search/tabs (~40px), categories (~32px), sample grid (flex, ~350px)
// Total: ~434px for comfortable sample browsing
const SOUND_BROWSER_HEIGHT = 434;

// Calculate offset to position window near bottom (height + margin)
const BOTTOM_OFFSET = DEFAULT_HEIGHT + DEFAULT_MARGIN;

// SSR and positioning constants
const SSR_FALLBACK_Y = 300;
const MIN_Y_FOR_HEADER = 48;

// localStorage keys for persistence
const STORAGE_KEY_POSITION = 'basilisk-repl-position';
const STORAGE_KEY_SIZE = 'basilisk-repl-size';

interface WindowBounds {
  minWidth: number;
  minHeight: number;
  maxWidth: string;
  maxHeight: string;
}

/**
 * Static bounds configuration for REPL window.
 * Uses viewport units (vw/vh) which are automatically responsive to window resizing.
 * No reactive state needed - the browser/Rnd handles viewport unit recalculation.
 */
const WINDOW_BOUNDS: WindowBounds = {
  minWidth: DEFAULT_MIN_WIDTH,
  minHeight: DEFAULT_MIN_HEIGHT,
  maxWidth: '90vw',
  maxHeight: '90vh',
};

/**
 * Hook for managing REPL window position, size, and bounds.
 * Handles drag and resize interactions for the floating REPL panel.
 * Bounds use viewport units and are automatically responsive without reactive state.
 *
 * @param isSoundBrowserOpen - Whether the sound browser is currently open
 * @returns Object containing position, size, bounds, and event handlers
 */
export const useREPLWindow = (isSoundBrowserOpen: boolean = false): {
  position: Position;
  size: { width: number; height: number };
  bounds: WindowBounds;
  handleDragStop: (_e: DraggableEvent, d: DraggableData) => void;
  handleResizeStop: (
    _e: MouseEvent | TouchEvent,
    _direction: ResizeDirection,
    ref: HTMLElement,
    _delta: ResizableDelta,
    position: Position
  ) => void;
} => {
  // Calculate initial Y position to place window near bottom of screen
  // Ensure position is valid even on small viewports (min 48px from top for header)
  const calculateInitialY = (): number => {
    if (typeof window === 'undefined') {return SSR_FALLBACK_Y;}
    const idealY = window.innerHeight - BOTTOM_OFFSET;
    return Math.max(MIN_Y_FOR_HEADER, idealY);
  };

  // Persisted position and size - restored from localStorage on mount
  const [position, setPosition] = usePersistedState<Position>(
    STORAGE_KEY_POSITION,
    { x: DEFAULT_MARGIN, y: calculateInitialY() }
  );

  // Store base size (what user set, excluding sound browser expansion)
  const [baseSize, setBaseSize] = usePersistedState(
    STORAGE_KEY_SIZE,
    { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  );

  /**
   * Derive actual window size from base size and sound browser state.
   * No useEffect needed - this is pure computation, not external sync.
   */
  const size = useMemo(() => {
    const height = isSoundBrowserOpen
      ? baseSize.height + SOUND_BROWSER_HEIGHT
      : baseSize.height;

    return { width: baseSize.width, height };
  }, [isSoundBrowserOpen, baseSize.width, baseSize.height]);

  /**
   * Handle drag stop event from react-rnd
   */
  const handleDragStop = (_e: DraggableEvent, d: DraggableData): void => {
    setPosition({ x: d.x, y: d.y });
  };

  /**
   * Handle resize stop event from react-rnd.
   * Back-calculate the base height (excluding sound browser) to persist.
   */
  const handleResizeStop = (
    _e: MouseEvent | TouchEvent,
    _direction: ResizeDirection,
    ref: HTMLElement,
    _delta: ResizableDelta,
    position: Position
  ): void => {
    const newWidth = parseInt(ref.style.width, 10);
    const newHeight = parseInt(ref.style.height, 10);

    // Back-calculate base height (exclude sound browser expansion if open)
    const baseHeight = isSoundBrowserOpen
      ? newHeight - SOUND_BROWSER_HEIGHT
      : newHeight;

    setBaseSize({ width: newWidth, height: baseHeight });
    setPosition(position);
  };

  return {
    position,
    size,
    bounds: WINDOW_BOUNDS,
    handleDragStop,
    handleResizeStop,
  };
}
