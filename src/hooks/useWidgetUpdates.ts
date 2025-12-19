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

  // Apply widget updates to editor when widgets change
  // useEffect is appropriate here because updating CodeMirror is an imperative side effect
  useEffect(() => {
    const view = getView();

    if (!view) {
      return;
    }

    // Handle empty widget array - cleanup all widgets
    if (widgets.length === 0) {
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

      // Register visualization widgets with manager after a short delay
      // to allow CodeMirror to create the canvas elements
      setTimeout(() => {
        visualizations.forEach((widget, index) => {
          // Use index as ID if from is not available
          const widgetId = widget.from?.toString() || `widget-${index}`;

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
      }, 100);
    }

    // Cleanup removed widgets
    const currentPositions = new Set(widgets.map((w, i) => w.from?.toString() || `widget-${i}`));
    registeredWidgets.current.forEach(id => {
      if (!currentPositions.has(id)) {
        console.log('[useWidgetUpdates] Removing widget:', id);
        visualizationManager.unregisterWidget(id);
        registeredWidgets.current.delete(id);
      }
    });
  }, [getView, widgets]);
};

/**
 * Find the canvas element created by CodeMirror for a visualization widget.
 * Searches for canvas elements in the editor and matches by position.
 */
function findCanvasForWidget(view: EditorView, _widget: WidgetConfig): HTMLCanvasElement | null {
  // Get all canvas elements in the editor
  const canvases = view.dom.querySelectorAll('canvas');

  // For now, use a simple heuristic: find the canvas that was most recently added
  // This works because we call this right after updateWidgets creates the canvas
  if (canvases.length > 0) {
    const canvas = canvases[canvases.length - 1] as HTMLCanvasElement;
    console.log('[findCanvasForWidget] Found canvas:', canvas.width, 'x', canvas.height);
    return canvas;
  }

  return null;
}
