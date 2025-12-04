import { Button } from './ui/Button';

import type { EngineStatus } from '../types/engine';


type Props = {
  /** Current engine status (idle | initializing | ready | error) */
  engineStatus: EngineStatus;
  /** Whether Hydra audio bridge is connected */
  hydraLinked: boolean;
  /** Current Hydra connection status string */
  hydraStatus: string;
  /** Callback when Start Audio button is clicked */
  onStartEngine: () => void;
};

/**
 * Get display text for engine status indicator
 */
const getEngineStatusText = (status: EngineStatus): string => {
  switch (status) {
    case 'idle':
      return 'stopped';
    case 'initializing':
      return 'starting';
    case 'ready':
      return 'running';
    case 'error':
      return 'error';
  }
};

/**
 * Get button text based on engine status
 */
const getButtonText = (status: EngineStatus): string => {
  switch (status) {
    case 'idle':
    case 'error':
      return 'Start Audio';
    case 'initializing':
      return 'Starting…';
    case 'ready':
      return 'Running';
  }
};

/**
 * Application header bar with branding, status indicators, and engine controls.
 * Fixed at top of viewport (z-20).
 */
export const AppHeader = ({
  engineStatus,
  hydraLinked,
  hydraStatus,
  onStartEngine
}: Props): JSX.Element => {
  const isReady = engineStatus === 'ready';
  const canStart = engineStatus === 'idle' || engineStatus === 'error';

  return (
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
          <span>{isReady ? '●' : '○'}</span>
          <span>Audio: {getEngineStatusText(engineStatus)}</span>
        </div>

        {/* Hydra Bridge Status */}
        <div className="flex items-center gap-1.5">
          <span>{hydraLinked ? '●' : '○'}</span>
          <span>Hydra: {hydraStatus}</span>
        </div>

        {/* Start Audio Button */}
        <Button
          onClick={onStartEngine}
          disabled={!canStart}
          variant="primary"
          size="sm"
        >
          {getButtonText(engineStatus)}
        </Button>
      </div>
    </header>
  );
};
