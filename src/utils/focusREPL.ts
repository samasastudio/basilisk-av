/** Default delay in ms to wait before focusing (allows DOM to update) */
const DEFAULT_FOCUS_DELAY_MS = 50;

/**
 * Focus the REPL CodeMirror editor.
 * Uses a small delay to ensure the DOM is ready after visibility changes.
 */
export const focusREPL = (delay: number = DEFAULT_FOCUS_DELAY_MS): void => {
  setTimeout(() => {
    const cmContent = document.querySelector('.cm-content') as HTMLElement | null;
    cmContent?.focus();
  }, delay);
};
