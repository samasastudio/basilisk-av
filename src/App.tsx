import { useState, useEffect, useRef, useCallback } from 'react';
import HydraCanvas from './components/HydraCanvas';
import StrudelRepl from './components/StrudelRepl';
import HydraRepl from './components/HydraRepl';
import { Monitor } from 'lucide-react';
import DebugPanel from './components/DebugPanel';
import { initStrudel } from '@strudel/web';
import { initHydra } from '@strudel/hydra';

function App() {
  const [showHydraWindow, setShowHydraWindow] = useState(false);
  const [engineInitialized, setEngineInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);
  const [visualMode, setVisualMode] = useState<'default' | 'bass'>('default');
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const hydraInstanceRef = useRef<any>(null);

  const handleHydraInit = useCallback((synth: any) => {
    hydraInstanceRef.current = synth;
  }, []);

  const handleHydraExecute = useCallback((code: string) => {
    if (!hydraInstanceRef.current) return;

    try {
      // Debug: Check if 'a' exists
      const audioObj = (window as any).a;
      console.log('Hydra execution - window.a:', audioObj);
      console.log('Hydra execution - typeof window.a:', typeof audioObj);

      // Execute code within the context of the Hydra instance
      // We use a Function constructor to create a scope where 'h' is the hydra instance
      // and 'a' is the audio object (created by initHydra in Strudel)
      // and we use 'with(h)' to expose all hydra functions globally within that scope
      const run = new Function('h', 'a', `
        with (h) {
          ${code}
        }
      `);
      run(hydraInstanceRef.current, audioObj);
    } catch (e) {
      console.error("Hydra execution error:", e);
      // Could add a toast or UI error indication here
    }
  }, []);

  const startEngine = async () => {
    if (engineInitialized || isInitializing) return;

    setIsInitializing(true);
    try {
      const repl = await initStrudel({
        prebake: () => (window as any).samples('github:tidalcycles/dirt-samples')
      });

      // Make REPL globally accessible
      (window as any).repl = repl;

      // Extract or create a shared AudioContext for Hydra
      const sharedAudioContext = (repl as any).audioContext || (repl as any).context || new (window as any).AudioContext();

      // Ensure the audio context is resumed (browser requirement)
      await sharedAudioContext.resume();

      (window as any).replAudio = sharedAudioContext;

      // Expose initHydra globally so Strudel patterns can use it
      (window as any).initHydra = initHydra;

      // Set up analyser node for audio data extraction
      const analyser = sharedAudioContext.createAnalyser();
      analyser.fftSize = 256; // reasonable resolution for visual sync
      analyserRef.current = analyser;

      // Connect analyser properly - it should be in the audio chain
      // We'll connect it to the destination so it can analyze the output
      analyser.connect(sharedAudioContext.destination);

      // Try to find and connect Strudel's output to our analyser
      // This allows us to analyze the audio without breaking the chain
      if ((repl as any).output) {
        try {
          (repl as any).output.connect(analyser);
          console.log('Connected Strudel output to analyser');
        } catch (e) {
          console.warn('Could not connect Strudel output to analyser:', e);
        }
      }

      // Start animation loop to pull frequency data
      const updateAudioData = () => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(dataArray);
        }
        animationRef.current = requestAnimationFrame(updateAudioData);
      };
      updateAudioData();

      // Manually create Hydra's 'a' audio object
      // Since @strudel/hydra doesn't expose 'a' globally in our setup,
      // we create it ourselves with the same API
      const createHydraAudio = () => {
        const hydraAnalyser = sharedAudioContext.createAnalyser();
        hydraAnalyser.fftSize = 256;
        hydraAnalyser.smoothingTimeConstant = 0.8;

        // Connect Strudel's output to hydra analyser
        if ((repl as any).output) {
          (repl as any).output.connect(hydraAnalyser);
        }

        const fftSize = hydraAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(fftSize);

        // Create the 'a' object that Hydra expects
        const audioObject = {
          fft: [0, 0, 0, 0],
          _bins: 4,
          _analyser: hydraAnalyser,
          _dataArray: dataArray,

          setBins(num: number) {
            this._bins = Math.min(num, fftSize);
            this.fft = new Array(this._bins).fill(0);
          },

          _update() {
            this._analyser.getByteFrequencyData(this._dataArray);
            const binSize = Math.floor(this._dataArray.length / this._bins);
            for (let i = 0; i < this._bins; i++) {
              let sum = 0;
              for (let j = 0; j < binSize; j++) {
                sum += this._dataArray[i * binSize + j];
              }
              // Normalize to 0-1 range (Hydra expects 0-1)
              this.fft[i] = (sum / binSize) / 255;
            }
          }
        };

        // Expose globally
        (window as any).a = audioObject;

        // Animation loop to update FFT
        const updateHydraAudio = () => {
          if ((window as any).a && (window as any).a._update) {
            (window as any).a._update();
          }
          requestAnimationFrame(updateHydraAudio);
        };
        updateHydraAudio();

        console.log('✓ Created Hydra audio object (window.a) manually');
      };

      createHydraAudio();

      setEngineInitialized(true);
      console.log('Strudel engine initialized successfully', repl, { sharedAudioContext });
    } catch (error) {
      console.error('Failed to initialize Strudel engine:', error);
      alert('Failed to initialize audio engine. Check console for details.');
    } finally {
      setIsInitializing(false);
    }
  };


  // Placeholder for the pop-out logic
  const togglePopOut = () => {
    // Implementation for pop-out window will go here
    setShowHydraWindow(!showHydraWindow);
    alert("Pop-out functionality coming in next phase!");
  };

  // Helper to play Strudel test pattern
  const playTestPattern = () => {
    const repl = (window as any).repl;
    if (repl && repl.evaluate) {
      repl.evaluate(`$: s("bd*4").bank("RolandTR909").gain(0.8)`);
    } else {
      console.warn('Strudel REPL not available');
    }
  };

  // Helper to load a Hydra audio test snippet
  const loadHydraTest = () => {
    const code = `if (typeof a !== 'undefined') {
  a.setBins(4)
  
  osc(10, 0, () => a.fft[0] * 4)
    .rotate(0, () => a.fft[1] * 0.3)
    .modulateScale(noise(3, 0.1), () => a.fft[2] * 0.2)
    .color(
      () => a.fft[0] * 2,
      () => a.fft[1] * 1.5,
      () => a.fft[2] * 3
    )
    .out()
} else {
  osc(10, 0.1, 2).kaleid(4).color(1, 0.5, 0.8).out()
}`;
    handleHydraExecute(code);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (analyserRef.current) analyserRef.current.disconnect();
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-pm-bg text-pm-text overflow-hidden flex flex-col font-mono">
      {/* Header / Status Bar */}
      <header className="h-8 bg-pm-panel border-b border-pm-border flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-4">
          <span className="text-pm-secondary font-bold tracking-widest">BASILISK</span>
          <span className="text-xs text-gray-500">v0.1.0-alpha</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={startEngine}
            disabled={isInitializing || engineInitialized}
            className={`px-3 py-1 font-mono tracking-wider transition-colors border border-pm-border ${engineInitialized
              ? 'bg-green-500/20 text-green-500 cursor-default'
              : isInitializing
                ? 'bg-yellow-500/20 text-yellow-500 cursor-wait'
                : 'bg-pm-border hover:bg-pm-accent hover:text-black cursor-pointer'
              }`}
          >
            {engineInitialized ? 'ENGINE: READY' : isInitializing ? 'STARTING...' : 'START_ENGINE'}
          </button>
          <span className="text-green-500">SYSTEM: ONLINE</span>
          <span>MEM: 64K</span>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex relative">

        {/* Left Pane: Code (Strudel) */}
        <div className="w-1/2 h-full border-r border-pm-border flex flex-col">
          <StrudelRepl className="flex-1" engineReady={engineInitialized} />

          {/* Hydra Editor */}
          <div className="h-1/2 border-t border-pm-border flex flex-col">
            <HydraRepl
              className="flex-1"
              onExecute={handleHydraExecute}
            />
          </div>
        </div>

        {/* Right Pane: Visual Output */}
        <div className="w-1/2 h-full relative bg-black">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={togglePopOut}
              className="p-2 bg-black/50 hover:bg-pm-accent/50 rounded backdrop-blur text-white transition-colors"
              title="Pop Out Window"
            >
              <Monitor size={16} />
            </button>
          </div>

          {/* Visual mode selector */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <select
              value={visualMode}
              onChange={(e) => setVisualMode(e.target.value as 'default' | 'bass')}
              className="bg-pm-panel text-pm-text border border-pm-border rounded px-2 py-1"
            >
              <option value="default">Default</option>
              <option value="bass">Bass‑Responsive</option>
            </select>
          </div>

          <HydraCanvas
            className="w-full h-full"
            audioContext={(window as any).replAudio}
            audioData={audioData}
            visualMode={visualMode}
            onInit={handleHydraInit}
          />

          {/* Debug Panel */}
          {engineInitialized && (
            <div className="absolute bottom-16 left-4 z-20">
              <DebugPanel onPlayStrudel={playTestPattern} onLoadHydraTest={loadHydraTest} />
            </div>
          )}

          {/* Overlay UI elements could go here */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="text-xs text-pm-secondary opacity-50">
              FPS: 60.0
              <br />
              RES: 1920x1080
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
