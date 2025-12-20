/**
 * Centralized test mock factories for react-rnd types.
 *
 * These helpers create properly typed mock objects for testing drag/resize
 * interactions. Update these factories if the react-rnd library types change.
 */

import type { ResizeDirection } from 're-resizable';
import type { DraggableData, RndDragEvent, Position, ResizableDelta } from 'react-rnd';

/**
 * Creates a mock DraggableData object with sensible defaults.
 * Use this instead of inline type assertions in tests.
 */
export const createDragData = (overrides: Partial<DraggableData> = {}): DraggableData => ({
    x: 0,
    y: 0,
    node: document.createElement('div'),
    deltaX: 0,
    deltaY: 0,
    lastX: 0,
    lastY: 0,
    ...overrides,
});

/**
 * Creates a mock RndDragEvent (empty object cast to type).
 * The event parameter is typically unused in drag handlers.
 */
export const createDragEvent = (): RndDragEvent => ({} as RndDragEvent);

/**
 * Creates a mock MouseEvent for resize handlers.
 */
export const createResizeEvent = (): MouseEvent => new MouseEvent('mouseup');

/**
 * Creates a mock ResizableDelta with sensible defaults.
 */
export const createResizeDelta = (overrides: Partial<ResizableDelta> = {}): ResizableDelta => ({
    width: 0,
    height: 0,
    ...overrides,
});

/**
 * Creates a mock HTMLElement with style properties for resize handlers.
 */
export const createResizeRef = (width: string, height: string): HTMLElement => ({
    style: {
        width,
        height,
    },
} as HTMLElement);

/**
 * Creates a mock Position object.
 */
export const createPosition = (x: number, y: number): Position => ({ x, y });

/**
 * Valid resize directions for react-rnd.
 */
export const RESIZE_DIRECTIONS: readonly ResizeDirection[] = [
    'top',
    'right',
    'bottom',
    'left',
    'topRight',
    'bottomRight',
    'bottomLeft',
    'topLeft',
] as const;

/**
 * Default resize direction for tests.
 */
export const DEFAULT_RESIZE_DIRECTION: ResizeDirection = 'bottomRight';
