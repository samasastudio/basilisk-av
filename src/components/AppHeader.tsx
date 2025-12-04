import { Button } from './ui/Button';

type Props = {
  /** Whether the audio engine is fully initialized */
  engineInitialized: boolean;
  /** Whether engine initialization is in progress */
  isInitializing: boolean;
  /** Whether Hydra audio bridge is connected */
  hydraLinked: boolean;
  /** Current Hydra connection status string */
  hydraStatus: string;
  /** Callback when Start Audio button is clicked */
  onStartEngine: () => void;
};

/**
 * Application header bar with branding, status indicators, and engine controls.
 * Fixed at top of viewport (z-20).
 */
export const AppHeader = ({
  engineInitialized,
  isInitializing,
  hydraLinked,
  hydraStatus,
  onStartEngine
}: Props): JSX.Element => (
    <header className="fixed top-0 left-0 right-0 h-12 z-20 bg-basilisk-gray-900/85 backdrop-blur border-b border-basilisk-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <span className="font-sans font-semibold tracking-wider text-basilisk-white text-sm">
          BASILISK
        </span>
        <span className="text-xs text-basilisk-gray-400">v0.1.0</span>
      </div>

      <div className="flex items-center gap-6 text-xs font-sans text-basilisk-white">
        {/* Audio Engine Status */}
        <div className="flex items-center gap-1.5">
          <span>{engineInitialized ? '●' : '○'}</span>
          <span>Audio: {engineInitialized ? 'running' : 'stopped'}</span>
        </div>

        {/* Hydra Bridge Status */}
        <div className="flex items-center gap-1.5">
          <span>{hydraLinked ? '●' : '○'}</span>
          <span>Hydra: {hydraStatus}</span>
        </div>

        {/* Start Audio Button */}
        <Button
          onClick={onStartEngine}
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
  );
