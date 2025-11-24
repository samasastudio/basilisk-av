import { useState, useEffect, useRef } from 'react';
import HydraCanvas from './components/HydraCanvas';
import StrudelRepl from './components/StrudelRepl';
import { Monitor } from 'lucide-react';
import { initStrudel } from '@strudel/web';

function App() {
  const [showHydraWindow, setShowHydraWindow] = useState(false);
  const [engineInitialized, setEngineInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);
  const [visualMode, setVisualMode] = useState<'default' | 'bass'>('default');
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const startEngine = async () => {
    if (engineInitialized || isInitializing) return;

    setIsInitializing(true);
    try {
      const repl = await initStrudel({
        prebake: () => (window as any).samples('github:tidalcycles/dirt-samples')
      });

      // Make REPL globally accessible
      (window as any).repl = repl;

      // Extract or create a shared AudioContext for Hydra
      const sharedAudioContext = (repl as any).audioContext || (repl as any).context || new (window as any).AudioContext();
      (window as any).replAudio = sharedAudioContext;

      // Set up analyser node for audio data extraction
      const analyser = sharedAudioContext.createAnalyser();
      analyser.fftSize = 256; // reasonable resolution for visual sync
      analyserRef.current = analyser;

      // Connect analyser properly - it should be in the audio chain
      // We'll connect it to the destination so it can analyze the output
      analyser.connect(sharedAudioContext.destination);

      // Try to find and connect Strudel's output to our analyser
      // This allows us to analyze the audio without breaking the chain
      if ((repl as any).output) {
        try {
          (repl as any).output.connect(analyser);
          console.log('Connected Strudel output to analyser');
        } catch (e) {
          console.warn('Could not connect Strudel output to analyser:', e);
        }
      }

      // Start animation loop to pull frequency data
      const updateAudioData = () => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(dataArray);
        }
        animationRef.current = requestAnimationFrame(updateAudioData);
      };
      updateAudioData();

      setEngineInitialized(true);
      console.log('Strudel engine initialized successfully', repl, { sharedAudioContext });
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (analyserRef.current) analyserRef.current.disconnect();
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-pm-bg text-pm-text overflow-hidden flex flex-col font-mono">
      {/* Header / Status Bar */}
      <header className="h-8 bg-pm-panel border-b border-pm-border flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-4">
          <span className="text-pm-secondary font-bold tracking-widest">BASILISK</span>
          <span className="text-xs text-gray-500">v0.1.0-alpha</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={startEngine}
            disabled={isInitializing || engineInitialized}
            className={`px-3 py-1 font-mono tracking-wider transition-colors border border-pm-border ${engineInitialized
              ? 'bg-green-500/20 text-green-500 cursor-default'
              : isInitializing
                ? 'bg-yellow-500/20 text-yellow-500 cursor-wait'
                : 'bg-pm-border hover:bg-pm-accent hover:text-black cursor-pointer'
              }`}
          >
            {engineInitialized ? 'ENGINE: READY' : isInitializing ? 'STARTING...' : 'START_ENGINE'}
          </button>
          <span className="text-green-500">SYSTEM: ONLINE</span>
          <span>MEM: 64K</span>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex relative">

        {/* Left Pane: Code (Strudel) */}
        <div className="w-1/2 h-full border-r border-pm-border flex flex-col">
          <StrudelRepl className="flex-1" engineReady={engineInitialized} />

          {/* Hydra Editor Placeholder (Future) */}
          <div className="h-1/2 border-t border-pm-border flex flex-col">
            <div className="flex justify-between items-center p-2 bg-pm-panel border-b border-pm-border select-none">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
                <span className="text-pm-secondary font-mono text-sm tracking-wider">HYDRA_VISUALS</span>
              </div>
              <button className="text-xs hover:text-pm-secondary">[COMPILE]</button>
            </div>
            <div className="p-4 text-gray-500 text-sm">
                    // Hydra code editor coming soon...
            // Visuals currently running default script.
            </div>
          </div>
        </div>

        {/* Right Pane: Visual Output */}
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

          {/* Visual mode selector */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <select
              value={visualMode}
              onChange={(e) => setVisualMode(e.target.value as 'default' | 'bass')}
              className="bg-pm-panel text-pm-text border border-pm-border rounded px-2 py-1"
            >
              <option value="default">Default</option>
              <option value="bass">Bass‑Responsive</option>
            </select>
          </div>

          <HydraCanvas
            className="w-full h-full"
            audioContext={(window as any).replAudio}
            audioData={audioData}
            visualMode={visualMode}
          />

          {/* Overlay UI elements could go here */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="text-xs text-pm-secondary opacity-50">
              FPS: 60.0
              <br />
              RES: 1920x1080
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
