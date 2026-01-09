// Initialize Hydra
await initHydra({
  width: window.innerWidth,
  height: window.innerHeight
})

// Audio-reactive feedback loop with noise modulation
src(o0)
 .saturate(1.01)
 .scale(0.99)
 .color(1.01,1.01,1.01)
 .hue(() => a.fft[3])
 .modulateHue(src(o1).hue(.3).posterize(-1).contrast(.7),2)
  .layer(src(o1)
         .luma()
         .mult(gradient(1)
               .saturate(.9)))
  .out(o0)

noise(1, .2)
  .rotate(2,.5)
  .layer(src(o0)
  .scrollX(.2))
  .out(o1)

render(o0)