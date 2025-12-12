import { Rnd } from 'react-rnd';

import { useREPLWindow } from '../hooks/useREPLWindow';
import { useSoundBrowser } from '../hooks/useSoundBrowser';

import { StrudelRepl } from './StrudelRepl';

type Props = {
  /** Whether the audio engine is ready to execute code */
  engineReady: boolean;
  /** Callback to play a test pattern */
  onTestPattern: () => void;
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
  onTestPattern,
  onHalt,
  onExecute,
  onSave
}: Props): JSX.Element => {
  // Sound browser state (lifted up from StrudelRepl)
  const soundBrowser = useSoundBrowser();

  const {
    position,
    size,
    bounds,
    handleDragStop,
    handleResizeStop
  } = useREPLWindow(soundBrowser.isOpen);

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
      style={{
        transition: 'width 300ms ease-in-out, height 300ms ease-in-out'
      }}
      dragHandleClassName="drag-handle"
    >
      <div className="w-full h-full bg-basilisk-gray-900/85 backdrop-blur-lg border border-basilisk-gray-600 rounded-lg shadow-2xl overflow-hidden">
        <StrudelRepl
          engineReady={engineReady}
          onTestPattern={onTestPattern}
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
