import { useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  /** The key to listen for (e.g., 'Escape', ' ', 'h') */
  key: string;
  /** Require Ctrl/Cmd key */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Action to execute when shortcut is triggered */
  action: () => void;
  /** Whether this shortcut works inside the CodeMirror editor */
  allowInEditor?: boolean;
}

/**
 * Check if target is an editable element (input, textarea, contenteditable, or CodeMirror)
 */
const isEditableElement = (target: HTMLElement | null): boolean => {
  if (!target) return false;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true;
  if (target.isContentEditable) return true;
  if (target.closest?.('.cm-editor')) return true;
  return false;
};

/**
 * Check if a keyboard event matches a shortcut configuration
 */
const matchesShortcut = (e: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  // Check key match (case-insensitive)
  const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
  if (!keyMatches) return false;

  // Check Ctrl/Cmd modifier
  const hasCtrl = e.ctrlKey || e.metaKey;
  if (shortcut.ctrl && !hasCtrl) return false;
  if (!shortcut.ctrl && hasCtrl) return false;

  // Check Shift modifier
  if (shortcut.shift && !e.shiftKey) return false;
  if (!shortcut.shift && e.shiftKey) return false;

  return true;
};

/**
 * Hook for handling global keyboard shortcuts.
 * Automatically ignores shortcuts when user is typing in the editor,
 * unless `allowInEditor` is true for that shortcut.
 *
 * Uses a ref-based pattern to avoid re-attaching the event listener
 * when shortcuts change - the listener is attached once on mount.
 */
export const useGlobalKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
): void => {
  // Store current shortcuts in a ref so the listener always has the latest
  const shortcutsRef = useRef(shortcuts);
  const enabledRef = useRef(enabled);

  // Update refs when values change (no re-render, no listener re-attachment)
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Attach listener once on mount, remove on unmount
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!enabledRef.current) return;

      const isInEditor = isEditableElement(e.target as HTMLElement | null);

      const matchedShortcut = shortcutsRef.current.find((shortcut) =>
        matchesShortcut(e, shortcut) && (!isInEditor || shortcut.allowInEditor)
      );

      if (matchedShortcut) {
        e.preventDefault();
        matchedShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
