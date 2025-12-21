import { useTheme } from '../contexts/ThemeContext';
import { useHydraHUD } from '../hooks/useHydraHUD';

// HUD display constants
const HUD_DECIMAL_PLACES = 3;
const PERCENTAGE_MAX = 100;

type Props = {
  /** Whether to show the startup instruction text */
  showStartupText: boolean;
};

/**
 * Full-screen Hydra canvas container with optional startup text and dev HUD.
 * Renders as the background layer (z-0) for the entire application.
 */
export const HydraCanvas = ({ showStartupText }: Props): React.ReactElement => {
  const { hudValue } = useHydraHUD();
  const { theme } = useTheme();

  const isLight = theme === 'light';

  // Theme-aware HUD styling
  // Light mode: original solid styling, Dark mode: higher opacity for readability
  const hudClass = isLight
    ? 'absolute bottom-4 right-4 z-10 rounded bg-basilisk-gray-900/85 backdrop-blur border border-basilisk-gray-700 px-3 py-2 text-xs text-basilisk-white pointer-events-none'
    : 'absolute bottom-4 right-4 z-10 rounded backdrop-blur-md border px-3 py-2 text-xs pointer-events-none';

  const hudStyle: React.CSSProperties | undefined = isLight
    ? undefined
    : {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        color: '#a0a0a0',
      };

  return (
    <div className="fixed inset-0 z-0 bg-basilisk-black" id="hydra-container">
      {showStartupText && (
        <div className="w-full h-full flex items-center justify-center text-basilisk-gray-400 text-sm font-sans pointer-events-none">
          Run code with <code className="mx-1 px-2 py-1 bg-basilisk-gray-800 rounded font-mono">await initHydra()</code> to start visuals
        </div>
      )}

      {/* Dev HUD - Only visible in development mode */}
      {import.meta.env.DEV && (
        <div className={hudClass} style={hudStyle}>
          <div className="flex items-center justify-between font-sans gap-3">
            <span className="opacity-70">a.fft[0]</span>
            <span className="font-mono">{hudValue.toFixed(HUD_DECIMAL_PLACES)}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-32 bg-basilisk-gray-700 overflow-hidden rounded">
            <div
              className="h-full bg-basilisk-white transition-all duration-200"
              style={{ width: `${Math.min(PERCENTAGE_MAX, Math.max(0, hudValue * PERCENTAGE_MAX))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
