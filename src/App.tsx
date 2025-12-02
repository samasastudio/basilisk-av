import { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import StrudelRepl from './components/StrudelRepl';
import Button from './components/ui/Button';
import './utils/patchSuperdough'; // MUST be imported BEFORE @strudel/web
import { initStrudel } from '@strudel/web';
import { setBridgeInitializer } from './utils/patchSuperdough';

function App() {
  const [engineInitialized, setEngineInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hydraLinked, setHydraLinked] = useState(false);
  const [, setAudioContext] = useState<AudioContext | null>(null);
  const [hydraStatus, setHydraStatus] = useState('none');
  const [hydraHudValue, setHydraHudValue] = useState(0);
  const [hasExecutedCode, setHasExecutedCode] = useState(false);
  const strudelReplRef = useRef<any>(null);
  const hudAnimationRef = useRef<number | null>(null);

  // REPL panel position and size
  const [replPosition, setReplPosition] = useState({ x: 16, y: typeof window !== 'undefined' ? window.innerHeight - 416 : 300 });
  const [replSize, setReplSize] = useState({ width: 600, height: 400 });

  const startEngine = async () => {
    if (engineInitialized || isInitializing) return;

    setIsInitializing(true);
    try {
      // Register bridge initializer callback (invoked when audio first connects)
      setBridgeInitializer((audioContext) => {
        setAudioContext(audioContext);
        setHydraLinked(true);
        setHydraStatus('Strudel (a.fft)');
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
    <div className="w-screen h-screen bg-basilisk-black text-basilisk-white overflow-hidden relative">
      {/* LAYER 1: Full-screen Hydra Canvas (Background - z-0) */}
      <div className="fixed inset-0 z-0 bg-basilisk-black" id="hydra-container">
        {!hasExecutedCode && (
          <div className="w-full h-full flex items-center justify-center text-basilisk-gray-400 text-sm font-sans pointer-events-none">
            Run code with <code className="mx-1 px-2 py-1 bg-basilisk-gray-800 rounded font-mono">await initHydra()</code> to start visuals
          </div>
        )}

        {/* Dev HUD */}
        {import.meta.env.DEV && (
          <div className="absolute bottom-4 right-4 z-10 rounded bg-basilisk-gray-900/85 backdrop-blur border border-basilisk-gray-700 px-3 py-2 text-xs text-basilisk-white pointer-events-none">
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

      {/* LAYER 2: Fixed Header Bar (z-20) */}
      <header className="fixed top-0 left-0 right-0 h-12 z-20 bg-basilisk-gray-900/85 backdrop-blur border-b border-basilisk-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="font-sans font-semibold tracking-wider text-basilisk-white text-sm">BASILISK</span>
          <span className="text-xs text-basilisk-gray-400">v0.1.0</span>
        </div>
        <div className="flex items-center gap-6 text-xs font-sans text-basilisk-white">
          <div className="flex items-center gap-1.5">
            <span>{engineInitialized ? '●' : '○'}</span>
            <span>Audio: {engineInitialized ? 'running' : 'stopped'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{hydraLinked ? '●' : '○'}</span>
            <span>Hydra: {hydraStatus}</span>
          </div>
          <Button
            onClick={startEngine}
            disabled={isInitializing || engineInitialized}
            variant="primary"
            size="sm"
          >
            {engineInitialized ? 'Running' : isInitializing ? 'Starting…' : 'Start Audio'}
          </Button>
        </div>
      </header>

      {/* LAYER 3: Floating Draggable REPL Panel (z-30) */}
      <Rnd
        position={replPosition}
        size={replSize}
        onDragStop={(_e, d) => setReplPosition({ x: d.x, y: d.y })}
        onResizeStop={(_e, _direction, ref, _delta, position) => {
          setReplSize({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height)
          });
          setReplPosition(position);
        }}
        minWidth={400}
        minHeight={300}
        maxWidth="90vw"
        maxHeight="90vh"
        bounds="window"
        className="z-30"
        dragHandleClassName="drag-handle"
      >
        <div className="w-full h-full bg-basilisk-gray-900/85 backdrop-blur-lg border border-basilisk-gray-600 rounded-lg shadow-2xl overflow-hidden">
          <StrudelRepl
            engineReady={engineInitialized}
            onTestPattern={playTestPattern}
            onHalt={hushAudio}
            onExecute={() => setHasExecutedCode(true)}
            statusLabel={engineInitialized ? 'ready' : 'stopped'}
          />
        </div>
      </Rnd>
    </div>
  );
}

export default App;
