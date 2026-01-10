// Initialize Hydra
await initHydra({
  width: window.innerWidth,
  height: window.innerHeight
})

// Audio-reactive kaleidoscope (Algorithmic Minimalism)
osc(3.762, () => (a.fft[3] * 0.05) + 0.01, -3.794)
    .rotate()
    .kaleid()
    .colorama(() => a.fft[0] / 1e4)
    .pixelate(128)
    .out();
