import { useRef } from 'react';
import { Rnd } from 'react-rnd';

import { useClickAway } from '../hooks/useClickAway';
import { usePanelExclusivity } from '../hooks/usePanelExclusivity';
import { useREPLWindow } from '../hooks/useREPLWindow';
import { useSoundBrowser } from '../hooks/useSoundBrowser';
import { useUserLibrary } from '../hooks/useUserLibrary';

import { StrudelRepl } from './StrudelRepl';

type Props = {
  /** Whether the audio engine is ready to execute code */
  engineReady: boolean;
  /** Callback to halt/stop all audio */
  onHalt: () => void;
  /** Callback when code is executed */
  onExecute: () => void;
  /** Callback to save the current script */
  onSave: (code: string) => void;
};

/**
 * Draggable and resizable REPL window wrapper.
 * Manages window position, size, and bounds via useREPLWindow hook.
 * Renders as a floating panel (z-30).
 */
export const REPLWindow = ({
  engineReady,
  onHalt,
  onExecute,
  onSave
}: Props): JSX.Element => {
  // Panel exclusivity state (manages which panel is open)
  const panelState = usePanelExclusivity();

  // Sound browser state (uses panel exclusivity for visibility)
  const soundBrowser = useSoundBrowser(engineReady, panelState);

  // User library state (uses panel exclusivity for visibility)
  // Pass engineReady so samples are registered when audio engine starts
  const userLibrary = useUserLibrary({ panelState, engineReady });

  // Check if any panel is open (for window sizing and click-away)
  const isAnyPanelOpen = panelState.activePanel !== 'none';

  const {
    position,
    size,
    bounds,
    handleDragStop,
    handleResizeStop
  } = useREPLWindow(isAnyPanelOpen);

  // Ref for click-away detection
  const replContainerRef = useRef<HTMLDivElement>(null);

  // Close active panel when clicking outside REPL
  useClickAway(replContainerRef, panelState.closePanel, isAnyPanelOpen);

  return (
    <Rnd
      position={position}
      size={size}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={bounds.minWidth}
      minHeight={bounds.minHeight}
      maxWidth={bounds.maxWidth}
      maxHeight={bounds.maxHeight}
      bounds="window"
      className="z-30"
      dragHandleClassName="drag-handle"
    >
      <div
        ref={replContainerRef}
        className="w-full h-full bg-basilisk-gray-900/85 backdrop-blur-lg border border-basilisk-gray-600 rounded-lg shadow-2xl overflow-hidden"
      >
        <StrudelRepl
          engineReady={engineReady}
          onHalt={onHalt}
          onExecute={onExecute}
          onSave={onSave}
          statusLabel={engineReady ? 'ready' : 'stopped'}
          soundBrowser={soundBrowser}
          userLibrary={userLibrary}
          panelState={panelState}
        />
      </div>
    </Rnd>
  );
};
