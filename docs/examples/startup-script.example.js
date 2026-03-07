//Hydra Script
voronoi(8,1)
.mult(osc(10,0.1,()=>Math.sin(time)*3).saturate(3).kaleid(200))
.modulate(o0,0.5)
.add(o0,0.8)
.scrollY(-0.01)
.scale(0.99)
.modulate(voronoi(8,1),0.008)
.luma(0.3)
.out()


speed = 0.1

//Strudel Script
setcps(0.9)

const kick = seq(
  s("bd*2 [~ bd] bd").gain(1).cut(1),
  s("bd [~ bd] bd*2").gain(1).cut(1),
  s("bd*3 [~ bd]").gain(1).cut(1)
).slow(2)

const snare = seq(
  s("~ sd ~ [sd]").gain(0.85),
  s("~ sd ~ [sd?]").gain(0.85)
).slow(4).room(0.2).size(0.5)

const hats = seq(
  s("hh*8").gain("0.3 0.2 0.25 0.2").pan("0.2 0.8 0.3 0.7"),
  s("hh*16").gain("0.2 0.15 0.2 0.1").pan("0.7 0.3 0.6 0.4")
).slow(2)

const clap = s("~ [cp?] ~ cp").gain(0.4).delay(0.125).room(0.25).size(0.6)

const shimmer = s("oh?*2").gain(0.25).speed("0.8 1 1.2").pan("0.1 0.9").cut(2)

const grooveA = stack(kick, snare, hats, clap, shimmer)
const grooveB = stack(
  kick.gain(0.9),
  snare,
  hats,
  clap.gain(0.25),
  shimmer.gain(0.15).speed("0.7 1 1.1")
)
const grooveC = stack(
  kick,
  snare.gain(0.7),
  hats.slow(1.5),
  clap,
  shimmer
)
const grooveD = stack(
  kick.slow(2),
  snare,
  hats,
  clap.gain(0.5),
  shimmer.gain(0.2)
)

const rhythm = seq(grooveA, grooveB, grooveA, grooveC, grooveA, grooveD).slow(8)

const pad = seq(
  note("[c3 eb3 g3 bb3] [ab2 c3 eb3 g3] [f2 ab2 c3 eb3] [g2 b2 d3 f3]"),
  note("[db3 f3 ab3 c4] [bb2 db3 f3 ab3] [eb3 g3 bb3 d4] [f3 ab3 c4 eb4]"),
  note("[c3 eb3 g3 bb3] [f2 ab2 c3 eb3] [db3 f3 ab3 c4] [eb3 g3 bb3 d4]")
)
  .s("sine")
  .slow(12)
  .gain(0.16)
  .room(0.6)
  .size(0.9)
  .pan("0.12 0.88")

const drone = note("c2 ~ g1 ~ bb1? ~ g1 ~ f1? ~")
  .s("sine")
  .slow(9)
  .gain(0.07)
  .pan("0.45 0.55")

const lead = seq(
  note("c4 ~ eb4 ab4 ~ b4 g4? eb4 ~"),
  note("db4 g4 ~ ab4 eb4? ~ c4 b4"),
  note("eb4 ~ g4 bb4 ~ ab4 g4? eb4 ~")
)
  .s("sine")
  .slow(6)
  .gain(0.12)
  .pan("0.8 0.2 0.7 0.3")

const arp = seq(
  note("[c5 c6] eb5 ab5 b5? g5 db5 eb5 ab5?"),
  note("[db5 db6] f5 ab5 c6? bb5 eb5 f5 ab5?")
)
  .s("sine")
  .slow(4)
  .gain(0.08)
  .pan("0.15 0.85")
  .speed("0.8 1 1.2")

stack(rhythm, pad, drone, lead, arp)

