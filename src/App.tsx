import { useState } from 'react';
import { Rnd } from 'react-rnd';

import { StrudelRepl } from './components/StrudelRepl';
import { Button } from './components/ui/Button';
import './utils/patchSuperdough'; // MUST be imported BEFORE @strudel/web
import { useHydraHUD } from './hooks/useHydraHUD';
import { useREPLWindow } from './hooks/useREPLWindow';
import { useStrudelEngine } from './hooks/useStrudelEngine';

export function App(): JSX.Element {
  const [hasExecutedCode, setHasExecutedCode] = useState(false);

  // Use HUD hook for dev mode visualization
  const { hudValue } = useHydraHUD();

  // Use REPL window hook for position, size, and bounds management
  const {
    position: replPosition,
    size: replSize,
    bounds: replBounds,
    handleDragStop,
    handleResizeStop,
  } = useREPLWindow();

  // Use Strudel engine hook for audio engine management
  const {
    engineInitialized,
    isInitializing,
    hydraLinked,
    hydraStatus,
    startEngine,
    playTestPattern,
    hushAudio,
  } = useStrudelEngine();


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
              <span className="font-mono">{hudValue.toFixed(3)}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-32 bg-basilisk-gray-700 overflow-hidden rounded">
              <div
                className="h-full bg-basilisk-white transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(0, hudValue * 100))}%` }}
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
            {engineInitialized && 'Running'}
            {isInitializing && !engineInitialized && 'Starting…'}
            {!isInitializing && !engineInitialized && 'Start Audio'}
          </Button>
        </div>
      </header>

      {/* LAYER 3: Floating Draggable REPL Panel (z-30) */}
      <Rnd
        position={replPosition}
        size={replSize}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        minWidth={replBounds.minWidth}
        minHeight={replBounds.minHeight}
        maxWidth={replBounds.maxWidth}
        maxHeight={replBounds.maxHeight}
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

