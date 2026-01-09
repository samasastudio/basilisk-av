// Initialize Hydra
await initHydra({
  width: window.innerWidth,
  height: window.innerHeight
})

let mask = shape(3, 1.2, 0.8).rotate(Math.PI * 1.2).scale(.39, .5)
  .add(shape(2, .6, .1).rotate(-Math.PI / 2).scale(-2, -0.001))
  .thresh(0.2).color(.5, .75, () => a.fft[0] + .5)

// Audio-reactive kaleidoscope (Algorithmic Minimalism)
osc(9, 0.01,1)
  .mult(osc(5,-0.1, 5).modulate(noise(1,0.5)).rotate(.7))
  .pixelate(() => (a.fft[2] * 5) + 32)
  .mult(mask)
  .modulateRotate(o0)
  

.out()