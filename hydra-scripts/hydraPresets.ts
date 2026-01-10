/**
 * Hydra visual preset code snippets for the REPL.
 */

export const DEFAULT_CODE = `// Hydra Visuals
// Ctrl+Enter to run

// "Egg of the Phoenix" by Alexandre Rangel
speed = 1.2
shape(99, .15, .5)
  .color(0, 1, 2)
  .diff(shape(240, .5, 0).scrollX(.05).rotate(() => time / 10).color(1, 0, .75))
  .diff(shape(99, .4, .002).scrollX(.10).rotate(() => time / 20).color(1, 0, .75))
  .diff(shape(99, .3, .002).scrollX(.15).rotate(() => time / 30).color(1, 0, .75))
  .diff(shape(99, .2, .002).scrollX(.20).rotate(() => time / 40).color(1, 0, .75))
  .diff(shape(99, .1, .002).scrollX(.25).rotate(() => time / 50).color(1, 0, .75))
  .modulateScale(
      shape(240, .5, 0).scrollX(.05).rotate(() => time / 10),
      () => (Math.sin(time / 3) * .2) + .2
  )
  .scale(1.6, .6, 1)
  .out()`;

export const AUDIO_TEST = `a.setBins(4)

osc(10, 0, () => a.fft[0] * 4)
  .rotate(0, () => a.fft[1] * 0.3)
  .modulateScale(noise(3, 0.1), () => a.fft[2] * 0.2)
  .out()`;

export const SIMPLE_FEEDBACK = `osc(5, 0.1, 0.8)
  .rotate(0.1, 0.05)
  .modulate(noise(2, 0.2), 0.2)
  .out()`;

export type PresetName = 'none' | 'audio' | 'feedback';

export const presetMap: Record<PresetName, string> = {
    none: DEFAULT_CODE,
    audio: AUDIO_TEST,
    feedback: SIMPLE_FEEDBACK,
};
