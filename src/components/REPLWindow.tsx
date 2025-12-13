import { useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';

import { useREPLWindow } from '../hooks/useREPLWindow';
import { useSoundBrowser } from '../hooks/useSoundBrowser';

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
  // Sound browser state (lifted up from StrudelRepl)
  const soundBrowser = useSoundBrowser(engineReady);

  const {
    position,
    size,
    bounds,
    handleDragStop,
    handleResizeStop
  } = useREPLWindow(soundBrowser.isOpen);

  // Ref for click-away detection
  const replContainerRef = useRef<HTMLDivElement>(null);

  // Click-away handler: close sound browser when clicking outside REPL
  useEffect(() => {
    if (!soundBrowser.isOpen) return;

    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;

      // Check if click is outside REPL container
      if (replContainerRef.current && !replContainerRef.current.contains(target)) {
        soundBrowser.close();
      }
    };

    // Add listener with slight delay to avoid immediate close on toggle
    const CLICK_AWAY_DELAY = 100; // ms - prevents immediate close on toggle button click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, CLICK_AWAY_DELAY);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundBrowser.isOpen, soundBrowser.close]);

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
        />
      </div>
    </Rnd>
  );
};
