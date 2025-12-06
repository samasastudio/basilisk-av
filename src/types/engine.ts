/**
 * Engine status state machine type.
 * Represents the current state of the audio engine lifecycle.
 *
 * State transitions:
 * - idle -> initializing (startEngine called)
 * - initializing -> ready (initialization successful)
 * - initializing -> error (initialization failed)
 * - error -> initializing (retry after resetError + startEngine)
 */
export type EngineStatus = 'idle' | 'initializing' | 'ready' | 'error';

/**
 * Helper to check if engine is in an active/ready state
 */
export const isEngineReady = (status: EngineStatus): boolean => status === 'ready';

/**
 * Helper to check if engine is currently initializing
 */
export const isEngineInitializing = (status: EngineStatus): boolean => status === 'initializing';

/**
 * Helper to check if engine can be started (not already running or initializing)
 */
export const canStartEngine = (status: EngineStatus): boolean =>
  status === 'idle' || status === 'error';
