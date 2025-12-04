/**
 * BASILISK AV - Pattern Preset Library
 * Algorithmic Minimalism aesthetic
 *
 * Constraints:
 * - Rotation: 0.01-0.1 rad/sec
 * - Minimal geometry
 * - Monochrome palette
 * - Subtle audio reactivity
 */

export interface PatternPreset {
  name: string;
  description: string;
  code: string;
}

export const patternPresets: PatternPreset[] = [
  {
    name: "Minimal Pulse",
    description: "Slow oscillating circle with subtle audio modulation",
    code: `// Initialize Hydra
await initHydra()

// Minimal pulse
osc(1, 0.01, 0)
  .rotate(0.02)
  .modulateScale(osc(0.3), () => a.fft[0] * 0.2)
  .out()

// Audio pattern
s("bd ~ sd ~, hh*4")`
  },
  {
    name: "Breathing Grid",
    description: "Geometric grid that breathes with the music",
    code: `// Initialize Hydra
await initHydra()

// Breathing grid
shape(4, 0.5, 0.01)
  .rotate(0.01)
  .scale(() => 1 + a.fft[0] * 0.15)
  .out()

// Audio pattern
s("bd sd, ~ sd*2, hh*8")`
  },
  {
    name: "Slow Modulation",
    description: "Two slow oscillators interacting",
    code: `// Initialize Hydra
await initHydra()

// Slow modulation
osc(0.5, 0.01, 0)
  .modulate(osc(0.3, 0.02), () => a.fft[0] * 0.25)
  .rotate(0.03)
  .out()

// Audio pattern
s("bd*2 sd, hh*4")`
  },
  {
    name: "Rotating Triangle",
    description: "Minimal triangle with audio-reactive rotation speed",
    code: `// Initialize Hydra
await initHydra()

// Rotating triangle
shape(3, 0.6, 0.01)
  .rotate(() => time * (0.02 + a.fft[0] * 0.05))
  .invert()
  .out()

// Audio pattern
s("bd ~ ~ sd, ~ ~ hh ~")`
  },
  {
    name: "Layered Circles",
    description: "Concentric circles with slow phase shift",
    code: `// Initialize Hydra
await initHydra()

// Layered circles
osc(2, 0.01, 0)
  .rotate(0.015)
  .layer(
    osc(1.5, -0.01, 0.5)
      .rotate(-0.01)
      .invert()
  )
  .modulateScale(osc(0.5), () => a.fft[0] * 0.15)
  .out()

// Audio pattern
s("bd sd*2, hh*8, ~ ~ ~ sd")`
  }
];

export { patternPresets };
