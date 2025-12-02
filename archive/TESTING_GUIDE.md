# Testing Guide: Hydra + Strudel Integration

## 🧪 Quick Test Checklist

### 1. **Engine Initialization**
- [ ] Click "START_ENGINE" button in header
- [ ] Wait for status to change to "ENGINE: READY" (green)
- [ ] Check console for "Strudel engine initialized successfully"
- [ ] Verify no errors in console

### 2. **Strudel Audio Playback**
- [ ] Type in Strudel REPL: `s("bd sd")`
- [ ] Click "EXECUTE" or press Shift+Enter
- [ ] Verify audio plays (kick and snare pattern)
- [ ] Check console for "Evaluating code" message

### 3. **Hydra Visual Display**
- [ ] Verify Hydra canvas shows animated kaleidoscope pattern
- [ ] Pattern should be rotating and pulsing
- [ ] No black screen or errors

### 4. **Audio-Visual Sync** ⭐
- [ ] Play Strudel pattern: `s("bd*4")`
- [ ] Watch Hydra canvas - should pulse with each kick
- [ ] Visual amplitude should increase with louder sounds
- [ ] Sync should be real-time (~60fps)

### 5. **Visual Mode Switching**
- [ ] Locate dropdown in top-left of Hydra canvas
- [ ] Switch from "Default" to "Bass-Responsive"
- [ ] Verify visual changes immediately
- [ ] Bass-Responsive should show more aggressive modulation
- [ ] Switch back to "Default" - should revert smoothly

### 6. **Advanced Patterns**
Try these Strudel patterns to test different audio characteristics:

```javascript
// High-frequency test
s("hh*8")

// Bass-heavy test
s("bd*2, sd").slow(2)

// Complex pattern
s("bd sd, hh*4, ~ cp")

// Melodic test (if samples loaded)
note("c3 e3 g3 c4").s("piano")
```

## 🎨 Expected Visual Behaviors

### Default Mode
- Smooth, flowing kaleidoscope
- Subtle pulsing with audio amplitude
- Rotation at constant speed
- Color shifts based on audio

### Bass-Responsive Mode
- Aggressive size modulation
- Kaleidoscope mirrors change with bass
- Noise modulation scales with amplitude
- More dramatic visual response

## 🐛 Troubleshooting

### Black Screen on Hydra Canvas
**Cause**: Hydra not initializing properly
**Fix**: 
1. Check console for errors
2. Verify `hydra-synth` is installed
3. Restart dev server

### No Audio Sync
**Cause**: AnalyserNode not connected
**Fix**:
1. Check console for "Strudel engine initialized" message
2. Verify AudioContext is created
3. Ensure animation loop is running

### Visual Mode Not Changing
**Cause**: Props not updating
**Fix**:
1. Check React DevTools for prop changes
2. Verify `useEffect` dependencies in HydraCanvas
3. Check console for re-render logs

### Audio Plays But No Visual Response
**Cause**: Audio data not flowing
**Fix**:
1. Check if `audioData` state is updating (React DevTools)
2. Verify analyser is connected to audio graph
3. Check `avgAmplitude` calculation in HydraCanvas

## 📊 Performance Metrics

**Expected Performance:**
- FPS: 60fps (check with browser DevTools)
- Audio latency: <50ms
- Visual update rate: ~60Hz
- Memory usage: <200MB

**Monitor in DevTools:**
1. Open Performance tab
2. Record while playing audio
3. Check for dropped frames
4. Verify requestAnimationFrame is consistent

## 🔍 Debug Console Commands

Open browser console and try:

```javascript
// Check if REPL is available
window.repl

// Check AudioContext
window.replAudio

// Check analyser node (in React component scope)
// Use React DevTools to inspect App component state

// Force visual update (in HydraCanvas scope)
// Use React DevTools to modify props
```

## ✅ Success Criteria

Integration is working correctly if:
1. ✅ Engine starts without errors
2. ✅ Strudel patterns play audio
3. ✅ Hydra visuals are animated
4. ✅ Visuals pulse/react to audio in real-time
5. ✅ Visual mode switching works instantly
6. ✅ No console errors
7. ✅ Performance stays at 60fps
8. ✅ Audio and visuals stay in sync

## 🎯 Next Steps After Testing

If all tests pass:
- Experiment with custom Hydra shaders
- Add more visual modes
- Implement parameter sliders
- Try beat detection
- Record canvas output

If tests fail:
- Check `INTEGRATION_SUMMARY.md` for architecture
- Review `HOW_TO_STRUDEL_HYDRA.md` for implementation details
- Check console for specific error messages
- Verify all dependencies are installed
