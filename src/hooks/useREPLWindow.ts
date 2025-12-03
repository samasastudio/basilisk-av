import { useState } from 'react';
import type { DraggableData, ResizableDelta, Position } from 'react-rnd';

/**
 * Hook for managing REPL window position and size.
 * Handles drag and resize interactions for the floating REPL panel.
 *
 * @returns Object containing position, size, and event handlers
 */
export function useREPLWindow() {
  // Calculate initial Y position to place window near bottom of screen
  const initialY = typeof window !== 'undefined' ? window.innerHeight - 416 : 300;

  const [position, setPosition] = useState<Position>({ x: 16, y: initialY });
  const [size, setSize] = useState({ width: 600, height: 400 });

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
    handleDragStop,
    handleResizeStop,
  };
}
