/* eslint-disable no-console, no-param-reassign, @typescript-eslint/no-explicit-any, @typescript-eslint/prefer-nullish-coalescing */
// Strudel integration requires parameter mutations and uses legacy || patterns
import { setWidget } from '@strudel/codemirror';

/** Default canvas dimensions for inline visualizations */
const DEFAULT_CANVAS_WIDTH = 500;
const DEFAULT_CANVAS_HEIGHT = 60;
const DEFAULT_SPIRAL_SIZE = 275;
const SPIRAL_SIZE_DIVISOR = 5;

/**
 * Helper to create and register canvas widgets
 */
export const getCanvasWidget = (id: string, options: any = {}): HTMLCanvasElement => {
    const { width = DEFAULT_CANVAS_WIDTH, height = DEFAULT_CANVAS_HEIGHT, pixelRatio = window.devicePixelRatio } = options;

    // Try to get existing canvas, but verify it's still in the document
    let canvas = document.getElementById(id) as HTMLCanvasElement | null;

    if (canvas && !document.body.contains(canvas)) {
        // Canvas exists but is detached - remove old ID reference
        canvas.removeAttribute('id');
        canvas = null;
    }

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = id;
    }

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Store widget position as data attribute for canvas detection
    if (options.from !== undefined) {
        canvas.dataset.widgetPosition = options.from.toString();
    }

    // Store visualization options as JSON data attribute for the visualization manager
    // This is necessary because Strudel's widget system only passes position info
    const vizOptions = { ...options };
    delete vizOptions.from;
    delete vizOptions.width;
    delete vizOptions.height;
    delete vizOptions.pixelRatio;
    canvas.dataset.vizOptions = JSON.stringify(vizOptions);

    setWidget(id, canvas);  // Register canvas with CodeMirror's widget system
    return canvas;
};

/**
 * Register Pattern.prototype methods for inline visualizations.
 * Returns true if successful, false if Pattern not yet available.
 * Note: Widget type registration with transpiler happens in strudelEngine.ts before REPL initialization.
 * This function adds the inline widget methods directly to window.Pattern.prototype because
 * @strudel/codemirror's registerWidget uses its own Pattern instance.
 */
export const registerPatternMethods = (): boolean => {
    const WindowPattern = (window as any).Pattern;

    if (!WindowPattern) {
        console.warn('[registerPatternMethods] window.Pattern not yet available');
        return false;
    }

    // Only register if not already registered
    if (WindowPattern.prototype._scope) {
        console.log('[registerPatternMethods] Methods already registered');
        return true;
    }

    // Directly assign methods to window.Pattern.prototype
    WindowPattern.prototype._scope = function(this: any, id?: string, options: any = {}) {
        id = id || 'scope';
        options = { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT, pos: 0.5, scale: 1, from: this.from, ...options };
        const ctx = getCanvasWidget(id, options).getContext('2d');
        if (!ctx) throw new Error(`Failed to get 2d context for canvas: ${id}`);
        return this.tag(id).scope({ ...options, ctx, id });
    };

    WindowPattern.prototype._pianoroll = function(this: any, id?: string, options: any = {}) {
        id = id || 'pianoroll';
        options = { from: this.from, ...options };
        const ctx = getCanvasWidget(id, options).getContext('2d');
        if (!ctx) throw new Error(`Failed to get 2d context for canvas: ${id}`);
        return this.tag(id).pianoroll({ fold: 1, ...options, ctx, id });
    };

    WindowPattern.prototype._punchcard = function(this: any, id?: string, options: any = {}) {
        id = id || 'punchcard';
        options = { from: this.from, ...options };
        const ctx = getCanvasWidget(id, options).getContext('2d');
        if (!ctx) throw new Error(`Failed to get 2d context for canvas: ${id}`);
        return this.tag(id).punchcard({ fold: 1, ...options, ctx, id });
    };

    WindowPattern.prototype._spiral = function(this: any, id?: string, options: any = {}) {
        id = id || 'spiral';
        const _size = options.size || DEFAULT_SPIRAL_SIZE;
        options = { width: _size, height: _size, from: this.from, ...options, size: _size / SPIRAL_SIZE_DIVISOR };
        // Just create canvas and tag pattern - visualization manager handles rendering
        // (Strudel's spiral() uses onPaint which doesn't work for inline widgets)
        getCanvasWidget(id, options);
        return this.tag(id);
    };

    WindowPattern.prototype._spectrum = function(this: any, id?: string, options: any = {}) {
        id = id || 'spectrum';
        options = { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT, from: this.from, ...options };
        const ctx = getCanvasWidget(id, options).getContext('2d');
        if (!ctx) throw new Error(`Failed to get 2d context for canvas: ${id}`);
        // Delegate to Strudel's spectrum() which handles scrolling spectrogram
        return this.tag(id).spectrum({ ...options, ctx, id });
    };

    console.log('[registerPatternMethods] Pattern.prototype methods registered successfully');
    return true;
};
