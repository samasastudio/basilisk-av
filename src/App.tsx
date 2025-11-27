import { useState, useEffect, useRef, useCallback } from 'react';
import HydraCanvas from './components/HydraCanvas';
import StrudelRepl from './components/StrudelRepl';
import { Monitor } from 'lucide-react';
import './utils/patchSuperdough'; // MUST be imported BEFORE @strudel/web
import { initStrudel } from '@strudel/web';
import { type HydraBridge } from './utils/strudelHydraBridge';
import { setBridgeInitializer } from './utils/patchSuperdough';

function App() {
  const [showHydraWindow, setShowHydraWindow] = useState(false);
  const [engineInitialized, setEngineInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hydraLinked, setHydraLinked] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [hydraStatus, setHydraStatus] = useState('Hydra audio source: none');
  const [hydraHudValue, setHydraHudValue] = useState(0);
  const [hydraReady, setHydraReady] = useState(false);
  const hydraInstanceRef = useRef<any>(null);
  const strudelReplRef = useRef<any>(null);
  const hydraBridgeRef = useRef<HydraBridge | null>(null);
  const hudAnimationRef = useRef<number | null>(null);

  const handleHydraInit = useCallback((hydra: any) => {
    hydraInstanceRef.current = hydra;
    setHydraReady(true);
  }, []);

  const startEngine = async () => {
    if (engineInitialized || isInitializing) return;

    setIsInitializing(true);
    try {
      console.log('🎵 Step 1: Registering bridge initializer...');

      // Register a callback that will be called when the patcher detects the AudioContext
      setBridgeInitializer((audioContext) => {
        console.log('🎹 Bridge initializer called with AudioContext:', audioContext);
        setAudioContext(audioContext);
        setHydraLinked(true);
        setHydraStatus('Hydra audio source: Strudel (a.fft)');
        (window as any).replAudio = audioContext;
      });

      console.log('🎹 Step 2: Initializing Strudel (first connection will trigger bridge creation)...');

      // Now initialize Strudel - the patcher will create the bridge on first connection
      const repl = await initStrudel({
        prebake: () => (window as any).samples('github:tidalcycles/dirt-samples')
      });

      (window as any).repl = repl;
      strudelReplRef.current = repl;

      console.log('✅ Step 3: Strudel initialized - waiting for first audio connection...');

      setEngineInitialized(true);
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

  // Cleanup bridge on unmount
  useEffect(() => {
    return () => {
      hydraBridgeRef.current?.disconnect();
      hydraBridgeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const updateHud = () => {
      const val = (window as any).a?.fft?.[0] ?? 0;
      setHydraHudValue(val);
      hudAnimationRef.current = requestAnimationFrame(updateHud);
    };

    updateHud();

    return () => {
      if (hudAnimationRef.current) cancelAnimationFrame(hudAnimationRef.current);
    };
  }, []);

  const playTestPattern = () => {
    const repl = (window as any).repl;
    if (!repl || !repl.evaluate) return;
    repl.evaluate('s("bd*4").gain(0.8)');
  };

  const hushAudio = () => {
    const repl = (window as any).repl;
    if (repl && repl.stop) repl.stop();
  };

  return (
    <div className="w-screen h-screen bg-pm-bg text-pm-text overflow-hidden flex flex-col font-mono">
      {/* Header / Status Bar */}
      <header className="bg-pm-panel border-b border-pm-border flex flex-col">
        <div className="h-10 flex items-center justify-between px-4 select-none">
          <div className="flex items-center gap-4">
            <span className="text-pm-secondary font-bold tracking-widest">BASILISK</span>
            <span className="text-xs text-gray-500">v0.1.0-alpha</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className={engineInitialized ? 'text-green-400' : 'text-red-400'}>
              Audio: {engineInitialized ? 'running' : 'stopped'}
            </span>
            <span className={hydraLinked ? 'text-green-400' : 'text-yellow-400'}>
              {hydraStatus}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 pb-2 text-xs gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={startEngine}
              disabled={isInitializing || engineInitialized}
              className={`px-3 py-2 font-mono tracking-wider transition-colors border border-pm-border rounded ${engineInitialized
                ? 'bg-green-500/20 text-green-500 cursor-default'
                : isInitializing
                  ? 'bg-yellow-500/20 text-yellow-500 cursor-wait'
                  : 'bg-pm-border hover:bg-pm-accent hover:text-black cursor-pointer'
                }`}
            >
              {engineInitialized ? 'Audio running' : isInitializing ? 'Starting…' : 'Start audio engine'}
            </button>
            <div className="text-pm-secondary">Unified: Strudel + Hydra → Audio + Visuals</div>
          </div>
          <div className="text-pm-secondary">Write both patterns and visuals in one editor!</div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex relative">

        {/* Left Pane: Unified Code Editor (Strudel + Hydra) */}
        <div className="w-1/2 h-full border-r border-pm-border flex flex-col">
          <StrudelRepl
            className="flex-1"
            engineReady={engineInitialized}
            onTestPattern={playTestPattern}
            onHalt={hushAudio}
            statusLabel="Unified: Strudel + Hydra"
          />
        </div>

        {/* Right Pane: Visual Output */}
        <div className="w-1/2 h-full relative bg-black" id="hydra-container">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={togglePopOut}
              className="p-2 bg-black/50 hover:bg-pm-accent/50 rounded backdrop-blur text-white transition-colors"
              title="Pop Out Window"
            >
              <Monitor size={16} />
            </button>
          </div>

          {/* Strudel's initHydra() will inject a canvas with id="hydra-canvas" here */}
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
            Run code with <code className="mx-1 px-2 py-1 bg-gray-800 rounded">await initHydra()</code> to start visuals
          </div>

          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="text-xs text-pm-secondary opacity-70">
              {hydraStatus}
            </div>
          </div>

          {import.meta.env.DEV && (
            <div className="absolute bottom-4 right-4 z-50 rounded bg-black/70 px-2 py-1 text-xs text-white pointer-events-none w-48">
              <div className="flex items-center justify-between">
                <span className="opacity-70">a.fft[0]</span>
                <span>{hydraHudValue.toFixed(3)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-neutral-700 overflow-hidden rounded">
                <div
                  className="h-full bg-green-400"
                  style={{ width: `${Math.min(100, Math.max(0, hydraHudValue * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
