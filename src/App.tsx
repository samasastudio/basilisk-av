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
      <header className="relative z-30 bg-basilisk-gray-900/70 backdrop-blur-md border-b border-basilisk-gray-700/50 flex flex-col shadow-lg">
        <div className="h-10 flex items-center justify-between px-4 select-none">
          <div className="flex items-center gap-4">
            <span className="font-sans font-semibold tracking-wider text-basilisk-white">BASILISK</span>
            <span className="text-xs text-basilisk-gray-400">v0.1.0-alpha</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-sans text-basilisk-white">
            <span className="flex items-center gap-1.5">
              <span className="text-base leading-none">{engineInitialized ? '●' : '○'}</span>
              Audio: {engineInitialized ? 'running' : 'stopped'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-base leading-none">{hydraLinked ? '●' : '○'}</span>
              {hydraStatus}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 pb-2 text-xs gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={startEngine}
              disabled={isInitializing || engineInitialized}
              variant="primary"
              size="sm"
            >
              {engineInitialized ? '● Audio running' : isInitializing ? 'Starting…' : 'Start audio engine'}
            </Button>
            <div className="font-sans text-basilisk-gray-300">Unified: Strudel + Hydra → Audio + Visuals</div>
          </div>
          <div className="font-sans text-basilisk-gray-300">Write both patterns and visuals in one editor!</div>
        </div>
      </header>

      {/* Full-screen Hydra Canvas (Background) */}
      <div className="fixed inset-0 bg-basilisk-black" id="hydra-container">
        {/* Strudel's initHydra() will inject a canvas with id="hydra-canvas" here */}
        <div className="w-full h-full flex items-center justify-center text-basilisk-gray-400 text-sm font-sans pointer-events-none">
          Run code with <code className="mx-1 px-2 py-1 bg-basilisk-gray-800/50 backdrop-blur rounded font-mono">await initHydra()</code> to start visuals
        </div>

        {/* Pop-out button */}
        <div className="absolute top-20 right-4 z-10 flex gap-2">
          <button
            onClick={togglePopOut}
            className="p-2 bg-basilisk-gray-900/70 hover:bg-basilisk-gray-800/80 rounded backdrop-blur-md text-basilisk-white transition-colors duration-200 border border-basilisk-gray-700/50"
            title="Pop Out Window"
          >
            <Monitor size={16} />
          </button>
        </div>

        {/* HUD - Dev mode */}
        {import.meta.env.DEV && (
          <div className="absolute top-20 left-4 z-50 rounded bg-basilisk-gray-900/70 backdrop-blur-md border border-basilisk-gray-700/50 px-3 py-2 text-xs text-basilisk-white pointer-events-none">
            <div className="flex items-center justify-between font-sans gap-3">
              <span className="opacity-70">a.fft[0]</span>
              <span className="font-mono">{hydraHudValue.toFixed(3)}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-32 bg-basilisk-gray-700 overflow-hidden rounded">
              <div
                className="h-full bg-basilisk-white transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(0, hydraHudValue * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Overlayed Code Editor (Bottom Panel) */}
      <div className="fixed bottom-0 left-0 right-0 h-[45vh] z-20 pointer-events-none">
        <div className="h-full pointer-events-auto">
          <StrudelRepl
            className="flex-1 h-full"
            engineReady={engineInitialized}
            onTestPattern={playTestPattern}
            onHalt={hushAudio}
            statusLabel="Unified: Strudel + Hydra"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
