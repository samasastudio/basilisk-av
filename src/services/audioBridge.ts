// Audio analysis constants
const DEFAULT_FFT_BINS = 4;
const MAX_BYTE_VALUE = 255;

/**
 * Hydra Audio Bridge type - provides real-time FFT data for audio-reactive visuals
 */
export type HydraBridge = {
    analyser: AnalyserNode;
    gainNode: GainNode;
    fft: number[];
    bins: number;
    tick: () => void;
    setBins: (bins: number) => void;
    disconnect: () => void;
};

/**
 * Strudel → Hydra Audio Bridge
 *
 * Routes Strudel's audio through an AnalyserNode to provide real-time frequency
 * data for Hydra's audio-reactive visuals via window.a.fft[0-3].
 *
 * Audio Flow:
 * Strudel AudioWorklet → GainNode → AnalyserNode → AudioContext.destination
 *                           ↑            ↓
 *                      (intercept)   (analyze)
 *                                      ↓
 *                                  window.a.fft
 *
 * @param audioContext - The AudioContext from Strudel (must be the same instance)
 * @returns Bridge object with analyser and gain nodes, or null on failure
 */
export const initHydraBridge = (audioContext: AudioContext): HydraBridge | null => {
    if (!audioContext) {
        console.error('No AudioContext provided to bridge');
        return null;
    }

    // Create analyser to capture frequency data
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;

    // Create gain node as the interception point
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    // Connect: GainNode → AnalyserNode → Destination
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const hydraAudio: HydraBridge = {
        analyser,
        gainNode,
        bins: DEFAULT_FFT_BINS,
        fft: Array(DEFAULT_FFT_BINS).fill(0),
        setBins: (bins: number) => {
            hydraAudio.bins = Math.max(1, bins);
            hydraAudio.fft = Array(hydraAudio.bins).fill(0);
        },
        tick: () => {
            analyser.getByteFrequencyData(dataArray);
            const chunk = dataArray.length / hydraAudio.bins;
            hydraAudio.fft = hydraAudio.fft.map((_, idx) => {
                const start = Math.floor(idx * chunk);
                const end = Math.floor((idx + 1) * chunk);
                const slice = dataArray.slice(start, end);
                const sum = slice.reduce((acc, val) => acc + val, 0);
                const avg = slice.length ? sum / slice.length : 0;
                return avg / MAX_BYTE_VALUE; // Normalize to 0-1 range
            });
        },
        disconnect: () => {
            gainNode.disconnect();
            analyser.disconnect();
        }
    };

    // Expose globally for Hydra code to access
    window.a = hydraAudio;

    // Start continuous FFT updates
    const tick = (): void => {
        hydraAudio.tick();
        requestAnimationFrame(tick);
    };
    tick();

    return hydraAudio;
}

// ============================================================================
// Public API - Getter/Setter Functions
// ============================================================================

/**
 * Get FFT value for a specific frequency band.
 * Safe to call even if bridge is not initialized.
 *
 * Frequency bands (with default 4 bins):
 * - 0: Bass (0-128 Hz)
 * - 1: Low-mid (128-256 Hz)
 * - 2: Mid (256-512 Hz)
 * - 3: High (512+ Hz)
 *
 * @param index - Frequency band index (0-based)
 * @returns Normalized FFT value (0-1) or 0 if bridge not active
 */
export const getBridgeFFT = (index: number = 0): number => window.a?.fft?.[index] ?? 0;

/**
 * Get all FFT values as an array.
 * Safe to call even if bridge is not initialized.
 *
 * @returns Array of normalized FFT values (0-1) or empty array if bridge not active
 */
export const getAllFFT = (): number[] => window.a?.fft ?? [];

/**
 * Check if the audio bridge is active and connected.
 * Use this to verify bridge is ready before accessing FFT data.
 *
 * @returns true if window.a exists with FFT data
 */
export const isBridgeActive = (): boolean => Boolean(window.a?.fft);

/**
 * Get the current number of FFT bins (frequency bands).
 * Safe to call even if bridge is not initialized.
 *
 * @returns Number of frequency bands or 0 if bridge not active
 */
export const getBinCount = (): number => window.a?.bins ?? 0;

/**
 * Set the number of FFT bins (frequency bands).
 * More bins = more granular frequency analysis.
 * Safe to call even if bridge is not initialized.
 *
 * @param bins - Number of bins to use (must be >= 1)
 * @returns true if bins were set, false if bridge not active
 */
export const setBinCount = (bins: number): boolean => {
  if (!window.a?.setBins) return false;
  window.a.setBins(bins);
  return true;
};

/**
 * Manually trigger FFT data update.
 * Useful for testing or when animation frame loop is paused.
 * Safe to call even if bridge is not initialized.
 *
 * @returns true if tick was called, false if bridge not active
 */
export const updateFFT = (): boolean => {
  if (!window.a?.tick) return false;
  window.a.tick();
  return true;
};

/**
 * Disconnect the audio bridge and stop FFT updates.
 * Call this when shutting down the audio engine.
 * Safe to call even if bridge is not initialized.
 *
 * @returns true if bridge was disconnected, false if not active
 */
export const disconnectBridge = (): boolean => {
  if (!window.a?.disconnect) return false;
  window.a.disconnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).a;
  return true;
};

/**
 * Get the bridge instance for advanced use cases.
 * Most code should use the getter functions instead.
 *
 * @returns The HydraBridge instance or undefined if not initialized
 */
export const getBridgeInstance = (): HydraBridge | undefined => window.a;
