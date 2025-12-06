/** Default delay in ms to wait before focusing (allows DOM to update) */
const DEFAULT_FOCUS_DELAY_MS = 50;

/** Track pending focus timeout to allow debouncing */
let pendingFocusTimeout: number | null = null;

/**
 * Focus the REPL CodeMirror editor.
 * Uses a small delay to ensure the DOM is ready after visibility changes.
 * Debounced to handle rapid toggling - cancels pending focus if called again.
 */
export const focusREPL = (delay: number = DEFAULT_FOCUS_DELAY_MS): void => {
  if (pendingFocusTimeout !== null) {
    clearTimeout(pendingFocusTimeout);
  }

  pendingFocusTimeout = window.setTimeout(() => {
    const cmContent = document.querySelector('.cm-content') as HTMLElement | null;
    cmContent?.focus();
    pendingFocusTimeout = null;
  }, delay);
};
