/* eslint-disable no-console, no-param-reassign, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-explicit-any */
// Console logging is essential for visualization debugging
// param-reassign needed for canvas context modifications
// any types required for Strudel pattern API
// @ts-expect-error - @strudel/draw has no type definitions
import { __pianoroll } from '@strudel/draw';

/** Default number of cycles to display in visualizations */
const DEFAULT_VIZ_CYCLES = 4;
/** Default playhead position (0 = left, 1 = right) */
const DEFAULT_VIZ_PLAYHEAD = 0.5;

/** Default spiral margin (spacing between arms) */
const DEFAULT_SPIRAL_MARGIN = 15;
/** Default spiral inset (rotations before spiral starts) */
const DEFAULT_SPIRAL_INSET = 3;
/** Default spiral stretch (cycles per 360 degrees) */
const DEFAULT_SPIRAL_STRETCH = 1;
/** Spiral rendering increment for smooth curves (1/60 for ~60 segments per rotation) */
const SPIRAL_ANGLE_INCREMENT = 1 / 60; // eslint-disable-line @typescript-eslint/no-magic-numbers
/** Number of cycles to look back for spiral events */
const SPIRAL_LOOK_BEHIND = 4;
/** Default spiral playhead length in rotations */
const DEFAULT_SPIRAL_PLAYHEAD_LENGTH = 0.02;
/** Degrees offset for polar coordinate conversion (start from top) */
const POLAR_ANGLE_OFFSET = 90;
/** Degrees in a full rotation */
const DEGREES_PER_ROTATION = 360;
/** Radians per degree */
const RADIANS_PER_DEGREE = Math.PI / 180; // eslint-disable-line @typescript-eslint/no-magic-numbers

/**
 * Visualization widget configuration
 */
export interface VisualizationWidget {
  id: string;
  type: '_scope' | '_pianoroll' | '_punchcard' | '_spiral';
  canvas: HTMLCanvasElement;
  options: Record<string, unknown>;
}

/**
 * Manages inline visualization widgets and connects them to pattern rendering.
 *
 * This manager solves the "black canvas" problem by:
 * 1. Registering canvas elements created by CodeMirror widgets
 * 2. Running an animation loop that queries the current pattern for events (haps)
 * 3. Calling the appropriate draw functions with those haps to render to canvases
 * 4. Connecting to the audio analyser for scope/spectrum visualizations
 */
class VisualizationManager {
  private widgets = new Map<string, VisualizationWidget>();
  private isRunning = false;
  private isPlaying = false;
  private animationFrameId: number | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private getCurrentPattern: (() => any) | null = null;
  private getCurrentTime: (() => number) | null = null;

  /**
   * Register a visualization widget to receive pattern updates
   */
  registerWidget(widget: VisualizationWidget): void {
    console.log('[VizManager] Registering widget:', widget.id, widget.type);
    this.widgets.set(widget.id, widget);

    // Start animation loop if playing and not already running
    if (this.isPlaying && !this.isRunning) {
      this.start();
    }
  }

  /**
   * Unregister a widget (when it's removed from editor)
   */
  unregisterWidget(id: string): void {
    console.log('[VizManager] Unregistering widget:', id);
    this.widgets.delete(id);

    // Stop animation loop if no widgets remain
    if (this.widgets.size === 0) {
      this.stop();
    }
  }

  /**
   * Set the function to get the current playing pattern
   */
  setPatternGetter(getter: () => any): void {
    this.getCurrentPattern = getter;
    console.log('[VizManager] Pattern getter set');
  }

  /**
   * Set the function to get the current playback time
   */
  setTimeGetter(getter: () => number): void {
    this.getCurrentTime = getter;
    console.log('[VizManager] Time getter set');
  }

  /**
   * Set the audio analyser for scope/spectrum visualizations
   */
  setAudioAnalyser(analyser: AnalyserNode): void {
    this.audioAnalyser = analyser;
    console.log('[VizManager] Audio analyser connected');
  }

  /**
   * Set playback state to control animation loop
   */
  setPlaybackState(playing: boolean): void {
    this.isPlaying = playing;
    console.log('[VizManager] Playback state:', playing ? 'playing' : 'stopped');

    // Start animation if playing and have widgets
    if (playing && this.widgets.size > 0 && !this.isRunning) {
      this.start();
    }

    // Stop animation if not playing
    if (!playing && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[VizManager] Starting animation loop');
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  private stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    console.log('[VizManager] Stopped animation loop');
  }

  /**
   * Main animation loop - renders all active widgets
   * Only runs when playback is active
   */
  private animate = (): void => {
    if (!this.isRunning || !this.isPlaying) return;

    // Render all widgets
    this.widgets.forEach((widget) => {
      this.renderWidget(widget);
    });

    // Continue loop only if still playing
    if (this.isPlaying) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.isRunning = false;
      this.animationFrameId = null;
    }
  };

  /**
   * Render a single widget
   */
  private renderWidget(widget: VisualizationWidget): void {
    const ctx = widget.canvas.getContext('2d');
    if (!ctx) {
      console.warn('[VizManager] No canvas context for widget:', widget.id);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, widget.canvas.width, widget.canvas.height);

    // Render based on widget type
    if (widget.type === '_scope') {
      this.renderScope(widget, ctx);
    } else if (widget.type === '_pianoroll') {
      this.renderPianoroll(widget, ctx);
    } else if (widget.type === '_punchcard') {
      this.renderPunchcard(widget, ctx);
    } else if (widget.type === '_spiral') {
      this.renderSpiral(widget, ctx);
    }
  }

  /**
   * Render oscilloscope visualization
   */
  private renderScope(widget: VisualizationWidget, ctx: CanvasRenderingContext2D): void {
    if (!this.audioAnalyser) {
      console.warn('[VizManager] No audio analyser for scope');
      return;
    }

    // Get time-domain audio data
    const bufferLength = this.audioAnalyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    this.audioAnalyser.getFloatTimeDomainData(dataArray);

    // Draw waveform
    const width = widget.canvas.width;
    const height = widget.canvas.height;
    const sliceWidth = width / bufferLength;

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#75baff';
    ctx.beginPath();

    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i];
      const y = ((v + 1) / 2) * height; // Map -1 to 1 range to canvas height

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }

  /**
   * Render pianoroll visualization
   */
  private renderPianoroll(widget: VisualizationWidget, ctx: CanvasRenderingContext2D): void {
    if (!this.getCurrentPattern || !this.getCurrentTime) {
      console.warn('[VizManager] No pattern getter or time getter for pianoroll');
      return;
    }

    const pattern = this.getCurrentPattern();
    if (!pattern || !pattern.queryArc) {
      console.warn('[VizManager] No pattern or queryArc method');
      return;
    }

    const time = this.getCurrentTime();
    const options = widget.options || {};
    const cycles = (options.cycles as number) || DEFAULT_VIZ_CYCLES;
    const playhead = (options.playhead as number) || DEFAULT_VIZ_PLAYHEAD;

    // Calculate time window to display
    const lookBehind = cycles * playhead;
    const lookAhead = cycles * (1 - playhead);

    try {
      // Query pattern for events in visible time window
      const haps = pattern.queryArc(time - lookBehind, time + lookAhead);

      // Call the pianoroll drawing function from @strudel/draw
      __pianoroll({
        ctx,
        haps,
        time,
        cycles,
        playhead,
        ...options
      });
    } catch (error) {
      console.error('[VizManager] Error rendering pianoroll:', error);
    }
  }

  /**
   * Render punchcard visualization
   */
  private renderPunchcard(widget: VisualizationWidget, ctx: CanvasRenderingContext2D): void {
    if (!this.getCurrentPattern || !this.getCurrentTime) {
      console.warn('[VizManager] No pattern getter or time getter for punchcard');
      return;
    }

    const pattern = this.getCurrentPattern();
    if (!pattern || !pattern.queryArc) {
      console.warn('[VizManager] No pattern or queryArc method');
      return;
    }

    const time = this.getCurrentTime();
    const options = widget.options || {};
    const cycles = (options.cycles as number) || DEFAULT_VIZ_CYCLES;
    const playhead = (options.playhead as number) || DEFAULT_VIZ_PLAYHEAD;

    const lookBehind = cycles * playhead;
    const lookAhead = cycles * (1 - playhead);

    try {
      const haps = pattern.queryArc(time - lookBehind, time + lookAhead);

      // Use pianoroll draw function with punchcard styling
      __pianoroll({
        ctx,
        haps,
        time,
        cycles,
        playhead,
        vertical: 1, // Punchcard uses vertical orientation
        ...options
      });
    } catch (error) {
      console.error('[VizManager] Error rendering punchcard:', error);
    }
  }

  /**
   * Convert polar coordinates to cartesian (x, y)
   * Angle is in degrees, with 0 pointing up
   */
  private fromPolar(angle: number, radius: number, cx: number, cy: number): [number, number] {
    const radians = (angle - POLAR_ANGLE_OFFSET) * RADIANS_PER_DEGREE;
    return [cx + Math.cos(radians) * radius, cy + Math.sin(radians) * radius];
  }

  /**
   * Get x, y coordinates on a spiral at a given angle
   * The spiral grows outward as angle increases
   */
  private xyOnSpiral(
    angle: number,
    margin: number,
    cx: number,
    cy: number,
    rotate: number = 0
  ): [number, number] {
    return this.fromPolar((angle + rotate) * DEGREES_PER_ROTATION, margin * angle, cx, cy);
  }

  /**
   * Draw a segment of the spiral from one angle to another
   */
  private spiralSegment(
    ctx: CanvasRenderingContext2D,
    options: {
      from: number;
      to: number;
      margin: number;
      cx: number;
      cy: number;
      rotate: number;
      thickness: number;
      color: string;
      stretch: number;
      opacity?: number;
    }
  ): void {
    const { margin, cx, cy, thickness, color, stretch, opacity = 1 } = options;
    let { from, to, rotate } = options;

    // Apply stretch factor
    from *= stretch;
    to *= stretch;
    rotate *= stretch;

    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;

    ctx.beginPath();
    const [sx, sy] = this.xyOnSpiral(from, margin, cx, cy, rotate);
    ctx.moveTo(sx, sy);

    let angle = from;
    while (angle <= to) {
      const [x, y] = this.xyOnSpiral(angle, margin, cx, cy, rotate);
      ctx.lineTo(x, y);
      angle += SPIRAL_ANGLE_INCREMENT;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /**
   * Parse spiral configuration from widget options with defaults
   */
  private getSpiralConfig(
    options: Record<string, unknown>,
    canvasWidth: number,
    canvasHeight: number
  ): {
    stretch: number;
    inset: number;
    margin: number;
    thickness: number;
    activeColor: string;
    inactiveColor: string;
    playheadColor: string;
    playheadLength: number;
    steady: number;
    fade: boolean;
    padding: number;
    cx: number;
    cy: number;
  } {
    const stretch = (options.stretch as number) || DEFAULT_SPIRAL_STRETCH;
    const margin = (options.margin as number) || DEFAULT_SPIRAL_MARGIN;
    return {
      stretch,
      inset: (options.inset as number) || DEFAULT_SPIRAL_INSET,
      margin,
      thickness: (options.thickness as number) || margin / 2,
      activeColor: (options.activeColor as string) || '#75baff',
      inactiveColor: (options.inactiveColor as string) || '#3a5d80',
      playheadColor: (options.playheadColor as string) || '#ffffff',
      playheadLength: (options.playheadLength as number) || DEFAULT_SPIRAL_PLAYHEAD_LENGTH,
      steady: (options.steady as number) || 1,
      fade: options.fade !== false,
      padding: (options.padding as number) || 0,
      cx: canvasWidth / 2,
      cy: canvasHeight / 2,
    };
  }

  /**
   * Render spiral visualization
   * Events appear as arc segments along a rotating spiral
   */
  private renderSpiral(widget: VisualizationWidget, ctx: CanvasRenderingContext2D): void {
    if (!this.getCurrentPattern || !this.getCurrentTime) {
      console.warn('[VizManager] No pattern getter or time getter for spiral');
      return;
    }

    const pattern = this.getCurrentPattern();
    if (!pattern || !pattern.queryArc) {
      console.warn('[VizManager] No pattern or queryArc method');
      return;
    }

    const time = this.getCurrentTime();
    const config = this.getSpiralConfig(
      widget.options || {},
      widget.canvas.width,
      widget.canvas.height
    );

    // Rotation based on current time
    const rotate = config.steady * time;

    try {
      // Query pattern for events in visible time window
      const haps = pattern.queryArc(time - SPIRAL_LOOK_BEHIND, time);

      console.log('[VizManager] Drawing spiral - haps:', haps.length);

      // Base settings for spiral segments
      const baseSettings = {
        margin: config.margin / config.stretch,
        cx: config.cx,
        cy: config.cy,
        stretch: config.stretch,
        thickness: config.thickness,
      };

      // Draw each event as an arc segment on the spiral
      haps.forEach((hap: any) => {
        const isActive = hap.whole.begin <= time && hap.endClipped > time;
        const from = hap.whole.begin - time + config.inset;
        const to = hap.endClipped - time + config.inset - config.padding;

        // Get color from hap value or use default
        const hapColor = hap.value?.color ?? config.activeColor;
        const color = isActive ? hapColor : config.inactiveColor;

        // Calculate opacity for fade effect (events further in past fade out)
        const opacity = config.fade ? 1 - Math.abs((hap.whole.begin - time) / SPIRAL_LOOK_BEHIND) : 1;

        this.spiralSegment(ctx, {
          ...baseSettings,
          from,
          to,
          rotate,
          color,
          opacity,
        });
      });

      // Draw playhead marker
      this.spiralSegment(ctx, {
        ...baseSettings,
        from: config.inset - config.playheadLength,
        to: config.inset,
        rotate,
        color: config.playheadColor,
        opacity: 1,
      });
    } catch (error) {
      console.error('[VizManager] Error rendering spiral:', error);
    }
  }

  /**
   * Clear all widgets (called when pattern stops)
   */
  clear(): void {
    console.log('[VizManager] Clearing all widgets');
    this.widgets.forEach((widget) => {
      const ctx = widget.canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, widget.canvas.width, widget.canvas.height);
      }
    });
  }
}

// Export singleton instance
export const visualizationManager = new VisualizationManager();
