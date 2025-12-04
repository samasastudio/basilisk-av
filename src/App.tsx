import { useState } from 'react';

import './utils/patchSuperdough'; // MUST be imported BEFORE @strudel/web
import { AppHeader } from './components/AppHeader';
import { HydraCanvas } from './components/HydraCanvas';
import { REPLWindow } from './components/REPLWindow';
import { useStrudelEngine } from './hooks/useStrudelEngine';

export const App = (): JSX.Element => {
  const [hasExecutedCode, setHasExecutedCode] = useState(false);

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
      <HydraCanvas showStartupText={!hasExecutedCode} />

      <AppHeader
        engineInitialized={engineInitialized}
        isInitializing={isInitializing}
        hydraLinked={hydraLinked}
        hydraStatus={hydraStatus}
        onStartEngine={startEngine}
      />

      <REPLWindow
        engineReady={engineInitialized}
        onTestPattern={playTestPattern}
        onHalt={hushAudio}
        onExecute={() => setHasExecutedCode(true)}
      />
    </div>
  );
};
