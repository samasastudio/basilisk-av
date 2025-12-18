import { updateSliderWidgets, updateWidgets } from '@strudel/codemirror';
import { useSyncExternalStore, useEffect } from 'react';

import { widgetStore } from '../services/strudelEngine';

import type { WidgetConfig } from '../services/strudelEngine';
import type { EditorView } from '@codemirror/view';

/**
 * Hook to subscribe to widget updates and apply them to a CodeMirror editor.
 * Uses useSyncExternalStore for React-idiomatic external store subscription.
 *
 * The hook separates concerns:
 * - useSyncExternalStore handles subscription to the widget store (React-managed)
 * - useEffect applies the widgets to CodeMirror (imperative side effect)
 *
 * @param getView - Function to get the current CodeMirror EditorView
 */
export const useWidgetUpdates = (getView: () => EditorView | undefined): void => {
  // Subscribe to widget store using React's recommended pattern
  const widgets = useSyncExternalStore(
    widgetStore.subscribe,
    widgetStore.getSnapshot
  );

  // Apply widget updates to editor when widgets change
  // useEffect is appropriate here because updating CodeMirror is an imperative side effect
  useEffect(() => {
    const view = getView();
    if (!view || widgets.length === 0) return;

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
    }
  }, [getView, widgets]);
};
