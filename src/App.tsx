import { useState, useMemo, useCallback } from 'react';

import './utils/patchSuperdough'; // MUST be imported BEFORE @strudel/web
import { AppHeader } from './components/AppHeader';
import { HydraCanvas } from './components/HydraCanvas';
import { REPLWindow } from './components/REPLWindow';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { useREPLVisibility } from './hooks/useREPLVisibility';
import { useStrudelEngine } from './hooks/useStrudelEngine';
import { focusREPL } from './utils/focusREPL';

import type { KeyboardShortcut } from './hooks/useGlobalKeyboardShortcuts';

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

  // Wrapper to start engine and focus REPL
  const handleStartEngine = useCallback((): void => {
    startEngine();
    focusREPL();
  }, [startEngine]);

  // Wrapper to toggle REPL and focus when showing
  const handleToggleRepl = useCallback((): void => {
    const willBeVisible = !replVisible;
    toggleRepl();
    if (willBeVisible) {
      focusREPL();
    }
  }, [replVisible, toggleRepl]);

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: 'Escape',
      action: hushAudio,
      allowInEditor: true, // Escape should work even in editor
    },
    {
      key: ' ',
      action: handleStartEngine,
      ctrl: true,
      shift: true, // Ctrl+Shift+Space to avoid CodeMirror conflicts
      allowInEditor: true, // Works everywhere
    },
    {
      key: 'h',
      ctrl: true,
      action: handleToggleRepl,
      allowInEditor: true, // Ctrl+H works everywhere
    },
  ], [hushAudio, handleStartEngine, handleToggleRepl]);

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
