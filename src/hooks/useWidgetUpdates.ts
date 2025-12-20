/* eslint-disable func-style, max-depth, @typescript-eslint/prefer-nullish-coalescing */
// Function style disabled for helper functions, max-depth for canvas matching logic
import { updateSliderWidgets, updateWidgets } from '@strudel/codemirror';
import { useSyncExternalStore, useEffect, useRef } from 'react';

import { widgetStore } from '../services/strudelEngine';
import { visualizationManager } from '../services/visualizationManager';

import type { WidgetConfig } from '../services/strudelEngine';
import type { EditorView } from '@codemirror/view';

/**
 * Hook to subscribe to widget updates and apply them to a CodeMirror editor.
 * Uses useSyncExternalStore for React-idiomatic external store subscription.
 *
 * The hook separates concerns:
 * - useSyncExternalStore handles subscription to the widget store (React-managed)
 * - useEffect applies the widgets to CodeMirror (imperative side effect)
 * - Registers visualization widgets with the visualization manager
 *
 * @param getView - Function to get the current CodeMirror EditorView
 */
export const useWidgetUpdates = (getView: () => EditorView | undefined): void => {
  // Subscribe to widget store using React's recommended pattern
  const widgets = useSyncExternalStore(
    widgetStore.subscribe,
    widgetStore.getSnapshot
  );

  // Track which widgets we've registered to avoid duplicates
  const registeredWidgets = useRef<Set<string>>(new Set());
  // Track pending animation frame for cleanup
  const pendingRegistration = useRef<number | null>(null);
  // Counter for generating unique IDs when position is unavailable
  const widgetIdCounter = useRef<number>(0);
  // Map to store stable IDs for widgets without position data
  const widgetIdMap = useRef<WeakMap<WidgetConfig, string>>(new WeakMap());

  // Generate stable widget ID based on type and position
  const getWidgetId = (widget: WidgetConfig, index: number): string => {
    if (widget.from !== undefined && widget.to !== undefined) {
      return `${widget.type}-${widget.from}-${widget.to}`;
    }

    // Fallback: Use WeakMap to ensure stable IDs across renders
    // This prevents ID collisions when position is unavailable
    let id = widgetIdMap.current.get(widget);
    if (!id) {
      // Include timestamp for true uniqueness guarantee to prevent collisions
      // during rapid re-evaluation with multiple visualization types
      id = `${widget.type}-${index}-${Date.now()}-${widgetIdCounter.current++}`;
      widgetIdMap.current.set(widget, id);
    }
    return id;
  };

  // Apply widget updates to editor when widgets change
  // useEffect is appropriate here because updating CodeMirror is an imperative side effect
  useEffect(() => {
    const view = getView();

    if (!view) {
      return;
    }

    // Cancel any pending registration from previous render
    if (pendingRegistration.current !== null) {
      cancelAnimationFrame(pendingRegistration.current);
      pendingRegistration.current = null;
    }

    // Handle empty widget array - cleanup all widgets
    if (widgets.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[useWidgetUpdates] clearing all widgets');
      updateSliderWidgets(view, []);
      updateWidgets(view, []);

      // Unregister all visualization widgets
      registeredWidgets.current.forEach(id => {
        visualizationManager.unregisterWidget(id);
      });
      registeredWidgets.current.clear();
      return;
    }

    // Separate slider widgets from visualization widgets
    const sliders = widgets.filter((w: WidgetConfig) => w.type === 'slider');
    const visualizations = widgets.filter((w: WidgetConfig) => w.type !== 'slider');

    // Apply slider widgets to CodeMirror
    if (sliders.length > 0) {
      updateSliderWidgets(view, sliders);
    }

    // Apply visualization widgets (_scope, _pianoroll, etc.) to CodeMirror
    if (visualizations.length > 0) {
      updateWidgets(view, visualizations);

      // Register visualization widgets with manager on next frame
      // Using requestAnimationFrame instead of setTimeout for better timing
      pendingRegistration.current = requestAnimationFrame(() => {
        visualizations.forEach((widget, index) => {
          // Generate stable widget ID
          const widgetId = getWidgetId(widget, index);

          // Skip if already registered
          if (registeredWidgets.current.has(widgetId)) {
            return;
          }

          // Find the canvas element created by updateWidgets
          const canvas = findCanvasForWidget(view, widget);
          if (!canvas) {
            console.warn('[useWidgetUpdates] Could not find canvas for widget:', widget);
            return;
          }

          // eslint-disable-next-line no-console
          console.log('[useWidgetUpdates] Registering widget with manager:', widget.type, widgetId);

          // Register with visualization manager
          visualizationManager.registerWidget({
            id: widgetId,
            type: widget.type as '_scope' | '_pianoroll' | '_punchcard' | '_spiral',
            canvas,
            options: {
              cycles: 4,
              playhead: 0.5,
              ...widget
            }
          });

          registeredWidgets.current.add(widgetId);
        });

        pendingRegistration.current = null;
      });
    }

    // Cleanup removed widgets
    const currentIds = new Set(visualizations.map((w, i) => getWidgetId(w, i)));
    registeredWidgets.current.forEach(id => {
      if (!currentIds.has(id)) {
        // eslint-disable-next-line no-console
        console.log('[useWidgetUpdates] Removing widget:', id);
        visualizationManager.unregisterWidget(id);
        registeredWidgets.current.delete(id);
      }
    });

    // Cleanup function to cancel pending animation frame
    return () => {
      if (pendingRegistration.current !== null) {
        cancelAnimationFrame(pendingRegistration.current);
        pendingRegistration.current = null;
      }
    };
  }, [getView, widgets]);
};

/**
 * Find the canvas element created by CodeMirror for a visualization widget.
 * Matches canvas by data-widget-position attribute set during creation.
 */
function findCanvasForWidget(view: EditorView, widget: WidgetConfig): HTMLCanvasElement | null {
  // Strategy 1: Match by data attribute (most reliable)
  if (widget.from !== undefined) {
    const widgetPosition = widget.from.toString();
    const canvas = view.dom.querySelector(`canvas[data-widget-position="${widgetPosition}"]`);
    if (canvas) {
      // eslint-disable-next-line no-console
      console.log('[findCanvasForWidget] Found canvas by position:', widgetPosition);
      return canvas as HTMLCanvasElement;
    }
  }

  // Strategy 2: Try to match by document position
  // Find the canvas closest to the widget's position in the document
  const canvases = [...view.dom.querySelectorAll('canvas')];
  if (widget.from !== undefined && canvases.length > 0) {
    const linePos = view.state.doc.lineAt(widget.from);

    for (const canvas of canvases) {
      const canvasElement = canvas as HTMLCanvasElement;
      try {
        const canvasLinePos = view.posAtDOM(canvasElement.parentElement || canvasElement);

        // If the canvas is within the same line or nearby (within 100 chars)
        if (Math.abs(canvasLinePos - linePos.from) < 100) {
          // eslint-disable-next-line no-console
          console.log('[findCanvasForWidget] Found canvas by proximity:', widget.from);
          return canvasElement;
        }
      } catch {
        // posAtDOM can fail if element is not in view, skip this canvas
        continue;
      }
    }
  }

  // Fallback: Return first unmatched canvas if only one exists
  if (canvases.length === 1) {
    // eslint-disable-next-line no-console
    console.log('[findCanvasForWidget] Using fallback - single canvas');
    return canvases[0] as HTMLCanvasElement;
  }

  console.warn('[findCanvasForWidget] Could not find canvas for widget:', widget);
  return null;
}
