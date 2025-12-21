import { useTheme } from '../contexts/ThemeContext';
import { canStartEngine } from '../types/engine';

import { Button } from './ui/Button';

import type { EngineStatus } from '../types/engine';

/**
 * Sun icon shown in light mode (click to switch to dark/muted)
 */
const SunIcon = (): React.ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

/**
 * Moon icon shown in dark mode (click to switch to light/solid)
 */
const MoonIcon = (): React.ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);


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
}: Props): React.ReactElement => {
  const isReady = engineStatus === 'ready';
  const canStart = canStartEngine(engineStatus);
  const { theme, toggleTheme } = useTheme();

  const isLight = theme === 'light';
  const themeTooltip = isLight ? 'Switch to dark mode' : 'Switch to light mode';

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

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={themeTooltip}
          aria-label={themeTooltip}
          className="p-1.5 rounded hover:bg-basilisk-gray-700/50 transition-colors text-basilisk-gray-300 hover:text-basilisk-white"
        >
          {isLight ? <SunIcon /> : <MoonIcon />}
        </button>

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
