import { useState, useRef, useCallback, useEffect } from 'react';
import HydraCanvas from './components/HydraCanvas';
import StrudelRepl from './components/StrudelRepl';
import HydraRepl from './components/HydraRepl';
import { Monitor } from 'lucide-react';
import { initStrudel } from '@strudel/web';
import { initHydra } from './utils/hydraBridge';

function AudioDebugHud({ linked }: { linked: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const fft = (window as any).a?.fft;
      if (Array.isArray(fft) && typeof fft[0] === 'number') {
        setValue(fft[0]);
      } else {
        setValue(0);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const width = Math.max(0, Math.min(100, value * 100));

  return (
    <div className="fixed bottom-2 left-2 z-50 rounded bg-black/70 px-3 py-2 text-xs text-white">
      <div className="flex items-center gap-2">
        <span className="uppercase tracking-wide text-[10px]">Dev HUD</span>
        <span className={`text-[10px] ${linked ? 'text-green-400' : 'text-red-300'}`}>{linked ? 'linked' : 'idle'}</span>
      </div>
      <div>a.fft[0]: {value.toFixed(3)}</div>
      <div className="mt-1 h-1.5 w-28 bg-neutral-700">
        <div className="h-full bg-green-400" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function App() {
  const [showHydraWindow, setShowHydraWindow] = useState(false);
  const [audioEngineStarted, setAudioEngineStarted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [hydraLinked, setHydraLinked] = useState(false);
  const [strudelOutput, setStrudelOutput] = useState<AudioNode | null>(null);

  const hydraInstanceRef = useRef<any>(null);
  const [hydraReady, setHydraReady] = useState(false);

  const handleHydraInit = useCallback((hydra: any) => {
    hydraInstanceRef.current = hydra;
    // Hydra is alive; we can now attempt to wire the analyser from Strudel.
    setHydraReady(true);
    setHydraLinked(false);
  }, []);

  const handleHydraExecute = useCallback((code: string) => {
    const hydra = hydraInstanceRef.current;
    const target = hydra?.synth ?? hydra;
    if (!target) return;

    try {
      const run = new Function('h', `
        with (h) {
          ${code}
        }
      `);
      run(target);
    } catch (e) {
      console.error('Hydra execution error:', e);
    }
  }, []);

  const startEngine = async () => {
    if (audioEngineStarted || isInitializing) return;

    setIsInitializing(true);
    try {
      const repl = await initStrudel({
        prebake: () => (window as any).samples('github:tidalcycles/dirt-samples')
      });

      (window as any).repl = repl;

      const sharedAudioContext: AudioContext = (repl as any).audioContext || (repl as any).context || new (window as any).AudioContext();
      if (sharedAudioContext.state === 'suspended') {
        await sharedAudioContext.resume();
      }

      setAudioContext(sharedAudioContext);
      if ((repl as any).output) {
        setStrudelOutput((repl as any).output as AudioNode);
      }

      setAudioEngineStarted(true);
      console.log('Strudel engine initialized successfully', repl, { sharedAudioContext });
    } catch (error) {
      console.error('Failed to initialize Strudel engine:', error);
      alert('Failed to initialize audio engine. Check console for details.');
    } finally {
      setIsInitializing(false);
    }
  };

  const playTestPattern = useCallback(() => {
    if (!audioEngineStarted) return;
    const repl = (window as any).repl;
    repl?.evaluate?.('s("bd*4").gain(0.8)');
  }, [audioEngineStarted]);

  const haltAudio = useCallback(() => {
    const repl = (window as any).repl;
    repl?.stop?.();
    if (typeof (window as any).hush === 'function') {
      (window as any).hush();
    }
  }, []);

  useEffect(() => {
    const linkHydra = async () => {
      if (!audioEngineStarted || !audioContext || !hydraInstanceRef.current || hydraLinked || !hydraReady) return;
      try {
        await initHydra({ audioContext, hydra: hydraInstanceRef.current, sourceNode: strudelOutput });
        setHydraLinked(true);
      } catch (error) {
        console.error('Failed to link Hydra audio', error);
      }
    };

    linkHydra();
  }, [audioEngineStarted, audioContext, hydraLinked, hydraReady, strudelOutput]);

  const togglePopOut = () => {
    setShowHydraWindow(!showHydraWindow);
    alert('Pop-out functionality coming in next phase!');
  };

  const transportLabel = audioEngineStarted ? 'Audio running' : isInitializing ? 'Starting…' : 'Start audio engine';
  const hydraLabel = hydraLinked ? 'Hydra audio source: Strudel (a.fft)' : 'Hydra audio source: not linked';

  return (
    <div className="w-screen h-screen bg-pm-bg text-pm-text overflow-hidden flex flex-col font-mono">
      <header className="h-14 bg-pm-panel border-b border-pm-border flex items-center justify-between px-4 select-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-pm-secondary font-bold tracking-widest">BASILISK</span>
            <span className="text-xs text-gray-500">Strudel + Hydra</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-pm-secondary">
            <span className={`px-2 py-0.5 rounded ${audioEngineStarted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-300'}`}>
              Audio: {audioEngineStarted ? 'running' : 'stopped'}
            </span>
            <span className={`px-2 py-0.5 rounded ${hydraLinked ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'}`}>
              {hydraLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={startEngine}
            disabled={isInitializing || audioEngineStarted}
            className={`px-3 py-2 font-mono tracking-wider transition-colors border border-pm-border rounded ${audioEngineStarted
              ? 'bg-green-500/20 text-green-500 cursor-default'
              : isInitializing
                ? 'bg-yellow-500/20 text-yellow-500 cursor-wait'
                : 'bg-pm-border hover:bg-pm-accent hover:text-black cursor-pointer'
              }`}
          >
            {transportLabel}
          </button>
          <span className="text-green-500">SYSTEM: ONLINE</span>
          <span>MEM: 64K</span>
        </div>
      </header>

      <div className="flex-1 flex relative">
        <div className="w-1/2 h-full border-r border-pm-border flex flex-col">
          <StrudelRepl
            className="flex-1"
            engineReady={audioEngineStarted}
            onPlayTest={playTestPattern}
            onHaltAll={haltAudio}
            outputLabel={audioEngineStarted ? (hydraLinked ? 'Speakers + Hydra analyser' : 'Speakers (Hydra pending)') : 'Stopped'}
          />

          <div className="h-1/2 border-t border-pm-border flex flex-col">
            <HydraRepl
              className="flex-1"
              onExecute={handleHydraExecute}
              audioLinked={hydraLinked}
            />
          </div>
        </div>

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

          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-black/60 text-white border border-white/10">{hydraLabel}</span>
            {audioEngineStarted ? (
              <span className="px-2 py-1 rounded bg-green-600/40 text-green-100 border border-green-500/30">Audio engine ready</span>
            ) : (
              <span className="px-2 py-1 rounded bg-red-600/40 text-red-100 border border-red-500/30">Start audio engine to enable visuals</span>
            )}
          </div>

          <HydraCanvas
            className="w-full h-full"
            audioContext={audioContext}
            onInit={handleHydraInit}
          />

          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="text-xs text-pm-secondary opacity-50">
              Hydra audio source: {hydraLinked ? 'Strudel (a.fft)' : 'none'}
            </div>
          </div>
        </div>
      </div>

      {import.meta.env.DEV && <AudioDebugHud linked={hydraLinked} />}
    </div>
  );
}

export default App;
