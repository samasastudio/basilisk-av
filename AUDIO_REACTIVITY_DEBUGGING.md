Here’s a prompt you can copy-paste into another AI to get it started:

---

**PROMPT TO AI (DEBUG STRUDEL + HYDRA):**

You are a technical debugging assistant with the ability to inspect a running Vite+React web app, open DevTools, run JavaScript in the console, and interact with DOM elements (e.g. click buttons, type into editors).

This app is a live-coding environment that combines:

* **Strudel** (music live-coding) via the `<strudel-editor>` web component from `@strudel/repl`.
* **Hydra** (visual synth) via `hydra-synth`, with a canvas rendered in React (e.g. a `<HydraCanvas />` component).

The goal:
**Verify and debug why Hydra is not reacting to Strudel’s audio output**, and produce a concise, factual report of what works, what fails, and where the connection breaks.

Assumptions:

* The app is already running at a URL I provide you (e.g. `http://localhost:5173`).
* Hydra is intended to be audio-reactive using its built-in audio analyser `a` (via `detectAudio: true`) and `a.fft[...]`.
* Strudel is intended to output audio through browser Web Audio (the default from `@strudel/repl`).

---

### 1. Start by confirming Hydra visuals work at all

**Goal:** Ensure Hydra is rendering *anything* before we worry about audio.

1. Open the app URL.

2. Find the Hydra canvas element (typically inside a “Visuals” or “Hydra” pane).

3. Open DevTools → Console.

4. In the console, run a **non-audio-reactive** Hydra patch that should animate on its own (this assumes Hydra is in global mode with `osc` defined):

   ```js
   // BASELINE HYDRA TEST (no audio needed)
   osc(10, 0.1, 1.2)
     .kaleid(3)
     .rotate(0.1, 0.02)
     .out()
   ```

5. Visually check whether the canvas shows a moving pattern (not a static black screen).

If the canvas remains blank or console shows errors (e.g. `osc is not defined`):

* Note the exact error messages and where they occur.
* Conclude that the problem is **Hydra setup / React lifecycle / `makeGlobal` config**, not audio.
* Stop here and report this clearly.

If this test passes, continue.

---

### 2. Confirm Strudel is actually producing audio

**Goal:** Ensure the Strudel side is alive and generating a loud, broadband signal.

1. Locate the `<strudel-editor>` element in the DOM.

2. Use whichever Strudel REPL API is available, or simulate user input:

   * Focus the editor.
   * Replace its contents with the following test pattern:

   ```js
   // STRUDEL TEST PATTERN – loud and broadband
   setcps(1) // 1 cycle per second

   stack(
     s("bd*4").gain(1.0),               // punchy kick
     s("sd*2").gain(0.9).pan("<0 1>"),  // snares L/R
     s("hh*8").gain(0.5),               // hats
     s("arpy*4").gain(0.6)              // bright melodic content
   )
   ```

3. Trigger playback, either by:

   * Simulating **Ctrl+Enter** within the editor, or
   * Clicking the REPL’s “run/play” button if present.

4. Check the browser console for any Strudel-related errors.

5. If you have no way to “hear” audio, at least check for:

   * No runtime errors,
   * Any Strudel logs indicating playback started,
   * No obvious Web Audio failures.

If Strudel fails to run (errors, no playback indication), report **“Strudel audio failure”** and stop. Otherwise, assume Strudel audio is working.

---

### 3. Verify Hydra’s audio analyser `a` is alive and receiving *something*

**Goal:** Confirm Hydra’s built-in audio analyser is initialised and responds to *any* audio input (mic/loopback), even before we worry about Strudel.

1. In the console, run:

   ```js
   typeof a
   ```

   * If the result is not `"object"` (e.g. `ReferenceError: a is not defined`), then Hydra is probably not in global mode (`makeGlobal: false`) or its audio system didn’t initialise.
   * If so, report:

     > “Hydra global audio object `a` is not defined; cannot use `a.fft`. Check `makeGlobal` or Hydra initialisation.”

   And stop.

2. If `a` exists, configure and visualise its FFT:

   ```js
   a.setBins(6)
   a.setSmooth(0.8)
   a.setScale(8)
   a.setCutoff(0.1)
   a.show()  // overlay visual FFT bars, useful for debugging
   ```

3. To test audio reactivity in isolation from Strudel:

   * Instruct the human user (me) to clap or speak near the microphone for several seconds.

   * While they do so, in the console run:

     ```js
     setInterval(() => console.log('fft0', a.fft[0]), 250)
     ```

   * Observe several log lines.

4. If `a.fft[0]` stays very close to `0` even when there should be mic input, report:

   > “Hydra’s analyser `a` is not receiving any audio from the selected input. Check browser mic permissions and OS input device routing.”

If Hydra isn’t receiving basic mic/loopback audio, there’s no way for it to react to Strudel yet. Fixing routing/permissions becomes the priority.

---

### 4. Test Strudel → Hydra linkage via FFT differences

Assuming:

* Strudel appears to be playing (from step 2), and
* Hydra’s `a` responds to *some* audio (from step 3),

now test whether Strudel’s output specifically is influencing `a.fft`.

**Procedure:**

1. Ensure Strudel test pattern is running.

2. In console, run:

   ```js
   // sample fft[0] while Strudel is playing
   let playingSamples = []
   let playingInterval = setInterval(() => {
     playingSamples.push(a.fft[0])
     console.log('playing fft0', a.fft[0])
   }, 250)
   ```

3. After ~5 seconds of Strudel playback, stop that interval:

   ```js
   clearInterval(playingInterval)
   ```

4. Now stop Strudel playback (via its UI/REPL “stop”/“clear” function, or by replacing the code with an empty pattern and running it).

5. With Strudel stopped, collect “silent” data:

   ```js
   let stoppedSamples = []
   let stoppedInterval = setInterval(() => {
     stoppedSamples.push(a.fft[0])
     console.log('stopped fft0', a.fft[0])
   }, 250)
   ```

6. After ~5 seconds, stop:

   ```js
   clearInterval(stoppedInterval)
   ```

7. Compute rough averages in the console:

   ```js
   function avg(arr) {
     return arr.reduce((s, v) => s + v, 0) / (arr.length || 1)
   }

   const avgPlay = avg(playingSamples)
   const avgStop = avg(stoppedSamples)
   console.log('avgPlay', avgPlay, 'avgStop', avgStop, 'diff', avgPlay - avgStop)
   ```

8. Interpret:

   * If `avgPlay` is significantly larger than `avgStop` (e.g. difference ≥ 0.05–0.1), conclude:

     > “Hydra’s analyser `a` *is* picking up extra energy when Strudel plays; audio linkage exists, but visuals may not be using `a.fft` strongly enough or patch may be too subtle.”

   * If `avgPlay` ≈ `avgStop` (difference very small), conclude:

     > “Hydra’s analyser `a` is not significantly affected by Strudel’s playback; OS routing / loopback device / mic positioning may be preventing Strudel’s audio from reaching Hydra.”

Report whichever case applies.

---

### 5. Install a strong Hydra audio-reactive test patch

Once you have evidence that `a.fft` changes when Strudel plays, replace the Hydra visuals with a **high-contrast audio-reactive patch** to make it obvious.

In the console, run:

```js
// HYDRA AUDIO-REACTIVE DEBUG PATCH

// Ensure analyser is configured
a.setBins(6)
a.setSmooth(0.8)
a.setScale(8)
a.setCutoff(0.1)
a.show() // keep the FFT overlay on

// Periodic logging (optional)
setInterval(() => console.log('fft0', a.fft[0]), 250)

// Visual: brightness, rotation, and color all driven by FFT bands
osc(10, 0.1, () => a.fft[0] * 4)      // brightness from low band
  .rotate(() => a.fft[2] * 3)         // spin from mid band
  .color(
    0.2 + () => a.fft[1] * 2,
    0.1 + () => a.fft[3] * 2,
    0.3 + () => a.fft[4] * 2
  )
  .modulate(
    noise(2, 0.2),
    () => a.fft[1] * 0.8
  )
  .out()
```

Then:

1. Start Strudel test pattern.
2. Observe:

   * Do the FFT overlay bars (`a.show()`) visibly jump more when Strudel is playing than when stopped?
   * Do the visuals clearly brighten, spin, and change color more when Strudel is playing?

If **FFT overlay moves but visuals don’t**, the patch is not correctly wired or is being overridden by another Hydra `.out()` call somewhere.
If **neither overlay nor visuals respond**, you are still dealing with an audio routing or Hydra initialisation problem.

---

### 6. Reporting format

At the end, produce a concise report with:

1. ✅ / ❌ **Hydra baseline render** (with any errors/logs).
2. ✅ / ❌ **Strudel test pattern execution** (with any errors/logs).
3. ✅ / ❌ **Hydra analyser `a` exists and responds to mic/loopback** (`typeof a`, FFT behavior).
4. Numeric output of `avgPlay`, `avgStop`, and `diff` from step 4.
5. Whether the **high-contrast Hydra patch** visually responds to Strudel playback.
6. A brief list of **concrete next actions** (e.g. “Switch Hydra to `makeGlobal: true`”, “Check browser mic permissions”, “Configure OS loopback device for Strudel → Hydra”).

Be precise, avoid speculation, and tie each conclusion back to an observed fact or log.
