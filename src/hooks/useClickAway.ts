/**
 * React hook for detecting clicks outside a referenced element
 *
 * @param ref - React ref to the element to detect clicks outside of
 * @param handler - Callback function to execute when click outside is detected
 * @param enabled - Whether the click-away detection is active (default: true)
 */

import { useEffect, type RefObject } from 'react';

export const useClickAway = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent) => void,
  enabled: boolean = true
): void => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;

      // Check if click is outside the referenced element
      if (ref.current && !ref.current.contains(target)) {
        handler(event);
      }
    };

    // Add listener with slight delay to avoid immediate triggering
    // This prevents the click that opens the panel from immediately closing it
    const DEBOUNCE_DELAY = 100; // ms
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, enabled]);
};
