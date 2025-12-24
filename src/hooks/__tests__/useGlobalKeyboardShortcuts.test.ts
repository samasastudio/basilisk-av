import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useGlobalKeyboardShortcuts } from '../useGlobalKeyboardShortcuts';

import type { KeyboardShortcut } from '../useGlobalKeyboardShortcuts';

describe('useGlobalKeyboardShortcuts', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('registers keydown event listener on mount', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 'Escape', action: vi.fn() }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('removes event listener on unmount', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 'Escape', action: vi.fn() }
    ];

    const { unmount } = renderHook(() => useGlobalKeyboardShortcuts(shortcuts));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('does not register listener when disabled', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 'Escape', action: vi.fn() }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts, false));

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('calls action when matching key is pressed', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'Escape', action }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not call action when different key is pressed', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'Escape', action }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    window.dispatchEvent(event);

    expect(action).not.toHaveBeenCalled();
  });

  it('matches Ctrl modifier correctly', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'h', ctrl: true, action }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    // Without Ctrl - should not fire
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    expect(action).not.toHaveBeenCalled();

    // With Ctrl - should fire
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('matches Shift modifier correctly', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'h', shift: true, action }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    // Without Shift - should not fire
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    expect(action).not.toHaveBeenCalled();

    // With Shift - should fire
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', shiftKey: true }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('matches combined Ctrl+Shift modifier correctly', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'h', ctrl: true, shift: true, action }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    // Only Ctrl - should not fire
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true }));
    expect(action).not.toHaveBeenCalled();

    // Only Shift - should not fire
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', shiftKey: true }));
    expect(action).not.toHaveBeenCalled();

    // Both Ctrl+Shift - should fire
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, shiftKey: true }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('treats metaKey as equivalent to ctrlKey', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'h', ctrl: true, action }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    // Meta (Cmd on Mac) should work as Ctrl
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', metaKey: true }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('is case-insensitive for letter keys', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'h', ctrl: true, action }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'H', ctrlKey: true }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('prevents default when shortcut matches', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'Escape', action }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('handles multiple shortcuts', () => {
    const action1 = vi.fn();
    const action2 = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'Escape', action: action1 },
      { key: ' ', action: action2 }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(action1).toHaveBeenCalledTimes(1);
    expect(action2).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(action1).toHaveBeenCalledTimes(1);
    expect(action2).toHaveBeenCalledTimes(1);
  });

  it('respects allowInEditor flag - blocks shortcuts without flag in editor', () => {
    const globalAction = vi.fn();
    const editorAction = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'a', action: globalAction, allowInEditor: false },
      { key: 'b', action: editorAction, allowInEditor: true }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    // Create mock CodeMirror editor element
    const editorDiv = document.createElement('div');
    editorDiv.className = 'cm-editor';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'cm-content';
    editorDiv.appendChild(contentDiv);
    document.body.appendChild(editorDiv);

    // Dispatch from within editor
    const eventA = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    Object.defineProperty(eventA, 'target', { value: contentDiv, enumerable: true });
    window.dispatchEvent(eventA);

    const eventB = new KeyboardEvent('keydown', { key: 'b', bubbles: true });
    Object.defineProperty(eventB, 'target', { value: contentDiv, enumerable: true });
    window.dispatchEvent(eventB);

    // 'a' should not fire (allowInEditor: false)
    expect(globalAction).not.toHaveBeenCalled();

    // 'b' should fire (allowInEditor: true)
    expect(editorAction).toHaveBeenCalledTimes(1);

    // Cleanup
    document.body.removeChild(editorDiv);
  });

  it('allows shortcuts outside editor when allowInEditor is false', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      { key: 'a', action, allowInEditor: false }
    ];

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    // Dispatch from window (not in editor)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    expect(action).toHaveBeenCalledTimes(1);
  });
});
