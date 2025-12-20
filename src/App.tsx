import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useMemo } from 'react';

import './utils/patchSuperdough'; // MUST be imported BEFORE @strudel/web
import { AppHeader } from './components/AppHeader';
import { HydraCanvas } from './components/HydraCanvas';
import { REPLWindow } from './components/REPLWindow';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { useREPLVisibility } from './hooks/useREPLVisibility';
import { useStrudelEngine } from './hooks/useStrudelEngine';
import { downloadFile, generateScriptFilename } from './utils/downloadFile';
import { focusREPL } from './utils/focusREPL';

import type { KeyboardShortcut } from './hooks/useGlobalKeyboardShortcuts';

export const App = (): React.ReactElement => {
  const [hasExecutedCode, setHasExecutedCode] = useState(false);

  // Create a client for TanStack Query inside the App component for proper isolation
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Data never becomes stale (like our cache)
        gcTime: Infinity, // Keep in cache forever (was cacheTime in v4)
        retry: 3,
        refetchOnWindowFocus: false,
      },
    },
  }), []);

  const {
    engineStatus,
    engineInitialized,
    hydraLinked,
    hydraStatus,
    startEngine,
    hushAudio,
  } = useStrudelEngine();

  const { isVisible: replVisible, toggleVisible: toggleRepl } = useREPLVisibility();

  // Define keyboard shortcuts with inline actions to avoid recreating on visibility changes
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: 'Escape',
      action: hushAudio,
      allowInEditor: true, // Escape should work even in editor
    },
    {
      key: ' ',
      action: () => {
        startEngine();
        focusREPL();
      },
      ctrl: true,
      shift: true, // Ctrl+Shift+Space to avoid CodeMirror conflicts
      allowInEditor: true, // Works everywhere
    },
    {
      key: 'h',
      ctrl: true,
      action: () => {
        const willBeVisible = !replVisible;
        toggleRepl();
        if (willBeVisible) {
          focusREPL();
        }
      },
      allowInEditor: true, // Ctrl+H works everywhere
    },
    {
      key: 's',
      ctrl: true,
      action: () => {
        // Pattern: Global preventDefault + local handler
        // This global shortcut prevents browser's "Save Page" dialog (preventDefault in useGlobalKeyboardShortcuts)
        // Actual save logic is in StrudelRepl.onKeyDown where it has access to current code state
      },
      allowInEditor: true, // Only works in editor where save makes sense
    },
  ], [hushAudio, startEngine, toggleRepl, replVisible]);

  useGlobalKeyboardShortcuts(shortcuts);

  // Handler to save the current script
  const handleSaveScript = (code: string): void => {
    const filename = generateScriptFilename();
    downloadFile(code, filename, 'text/javascript');
  };

  return (
    <QueryClientProvider client={queryClient}>
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
            onHalt={hushAudio}
            onExecute={() => setHasExecutedCode(true)}
            onSave={handleSaveScript}
          />
        )}
      </div>
    </QueryClientProvider>
  );
};
