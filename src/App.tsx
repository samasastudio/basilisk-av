import { useState, useMemo } from 'react';

import './utils/patchSuperdough'; // MUST be imported BEFORE @strudel/web
import { AppHeader } from './components/AppHeader';
import { HydraCanvas } from './components/HydraCanvas';
import { REPLWindow } from './components/REPLWindow';
import { useGlobalKeyboardShortcuts, KeyboardShortcut } from './hooks/useGlobalKeyboardShortcuts';
import { useREPLVisibility } from './hooks/useREPLVisibility';
import { useStrudelEngine } from './hooks/useStrudelEngine';

export const App = (): JSX.Element => {
  const [hasExecutedCode, setHasExecutedCode] = useState(false);

  const {
    engineStatus,
    engineInitialized,
    hydraLinked,
    hydraStatus,
    startEngine,
    playTestPattern,
    hushAudio,
  } = useStrudelEngine();

  const { isVisible: replVisible, toggleVisible: toggleRepl } = useREPLVisibility();

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: 'Escape',
      action: hushAudio,
      allowInEditor: true, // Escape should work even in editor
    },
    {
      key: ' ',
      action: startEngine,
      allowInEditor: false, // Space only works outside editor
    },
    {
      key: 'h',
      ctrl: true,
      action: toggleRepl,
      allowInEditor: true, // Ctrl+H works everywhere
    },
  ], [hushAudio, startEngine, toggleRepl]);

  useGlobalKeyboardShortcuts(shortcuts);

  return (
    <div className="w-screen h-screen bg-basilisk-black text-basilisk-white overflow-hidden relative">
      <HydraCanvas showStartupText={!hasExecutedCode} />

      <AppHeader
        engineStatus={engineStatus}
        hydraLinked={hydraLinked}
        hydraStatus={hydraStatus}
        onStartEngine={startEngine}
      />

      {replVisible && (
        <REPLWindow
          engineReady={engineInitialized}
          onTestPattern={playTestPattern}
          onHalt={hushAudio}
          onExecute={() => setHasExecutedCode(true)}
        />
      )}
    </div>
  );
};
