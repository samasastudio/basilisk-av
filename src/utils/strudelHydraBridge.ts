// Audio analysis constants
const DEFAULT_FFT_BINS = 4;
const MAX_BYTE_VALUE = 255;

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
export function initHydraBridge(audioContext: AudioContext): HydraBridge | null {
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
