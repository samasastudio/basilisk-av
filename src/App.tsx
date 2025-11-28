import { useState, useEffect, useRef } from 'react';
import StrudelRepl from './components/StrudelRepl';
import Button from './components/ui/Button';
import { Monitor } from 'lucide-react';
import './utils/patchSuperdough'; // MUST be imported BEFORE @strudel/web
import { initStrudel } from '@strudel/web';
import { setBridgeInitializer } from './utils/patchSuperdough';

function App() {
  const [showHydraWindow, setShowHydraWindow] = useState(false);
  const [engineInitialized, setEngineInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hydraLinked, setHydraLinked] = useState(false);
  const [, setAudioContext] = useState<AudioContext | null>(null);
  const [hydraStatus, setHydraStatus] = useState('Hydra audio source: none');
  const [hydraHudValue, setHydraHudValue] = useState(0);
  const strudelReplRef = useRef<any>(null);
  const hudAnimationRef = useRef<number | null>(null);

  const startEngine = async () => {
    if (engineInitialized || isInitializing) return;

    setIsInitializing(true);
    try {
      // Register bridge initializer callback (invoked when audio first connects)
      setBridgeInitializer((audioContext) => {
        setAudioContext(audioContext);
        setHydraLinked(true);
        setHydraStatus('Hydra audio source: Strudel (a.fft)');
        (window as any).replAudio = audioContext;
      });

      // Initialize Strudel (audio bridge created on first connection)
      const repl = await initStrudel({
        prebake: () => (window as any).samples('github:tidalcycles/dirt-samples')
      });

      (window as any).repl = repl;
      strudelReplRef.current = repl;
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
    setShowHydraWindow(!showHydraWindow);
    alert("Pop-out functionality coming in next phase!");
  };

  // HUD animation for dev mode
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
    <div className="w-screen h-screen bg-basilisk-black text-basilisk-white overflow-hidden flex flex-col">
      {/* Header / Status Bar */}
      <header className="bg-basilisk-gray-900/85 backdrop-blur border-b border-basilisk-gray-700 flex flex-col">
        <div className="h-10 flex items-center justify-between px-4 select-none">
          <div className="flex items-center gap-4">
            <span className="font-sans font-semibold tracking-wider text-basilisk-white">BASILISK</span>
            <span className="text-xs text-basilisk-gray-400">v0.1.0-alpha</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-sans">
            <span className={engineInitialized ? 'text-basilisk-success' : 'text-basilisk-error'}>
              Audio: {engineInitialized ? 'running' : 'stopped'}
            </span>
            <span className={hydraLinked ? 'text-basilisk-success' : 'text-basilisk-warning'}>
              {hydraStatus}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 pb-2 text-xs gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={startEngine}
              disabled={isInitializing || engineInitialized}
              variant={engineInitialized ? 'primary' : 'accent-cool'}
              size="sm"
              className={engineInitialized ? 'bg-basilisk-success/20 border-basilisk-success text-basilisk-success' : ''}
            >
              {engineInitialized ? 'Audio running' : isInitializing ? 'Starting…' : 'Start audio engine'}
            </Button>
            <div className="font-sans text-basilisk-gray-300">Unified: Strudel + Hydra → Audio + Visuals</div>
          </div>
          <div className="font-sans text-basilisk-gray-300">Write both patterns and visuals in one editor!</div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex relative">

        {/* Left Pane: Unified Code Editor (Strudel + Hydra) */}
        <div className="w-1/2 h-full border-r border-basilisk-gray-700 flex flex-col">
          <StrudelRepl
            className="flex-1"
            engineReady={engineInitialized}
            onTestPattern={playTestPattern}
            onHalt={hushAudio}
            statusLabel="Unified: Strudel + Hydra"
          />
        </div>

        {/* Right Pane: Visual Output */}
        <div className="w-1/2 h-full relative bg-basilisk-black" id="hydra-container">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={togglePopOut}
              className="p-2 bg-basilisk-gray-900/85 hover:bg-basilisk-accent-cool/50 rounded backdrop-blur text-basilisk-white transition-colors duration-200 border border-basilisk-gray-700"
              title="Pop Out Window"
            >
              <Monitor size={16} />
            </button>
          </div>

          {/* Strudel's initHydra() will inject a canvas with id="hydra-canvas" here */}
          <div className="w-full h-full flex items-center justify-center text-basilisk-gray-400 text-sm font-sans">
            Run code with <code className="mx-1 px-2 py-1 bg-basilisk-gray-800 rounded font-mono">await initHydra()</code> to start visuals
          </div>

          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="text-xs font-sans text-basilisk-gray-300 opacity-70">
              {hydraStatus}
            </div>
          </div>

          {import.meta.env.DEV && (
            <div className="absolute bottom-4 right-4 z-50 rounded bg-basilisk-gray-900/85 backdrop-blur border border-basilisk-gray-700 px-2 py-1 text-xs text-basilisk-white pointer-events-none w-48">
              <div className="flex items-center justify-between font-sans">
                <span className="opacity-70">a.fft[0]</span>
                <span className="font-mono">{hydraHudValue.toFixed(3)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-basilisk-gray-700 overflow-hidden rounded">
                <div
                  className="h-full bg-basilisk-success transition-all duration-200"
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
