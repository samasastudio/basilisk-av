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
 * Creates a bridge that routes Strudel's audio through an AnalyserNode to provide
 * FFT data for Hydra's audio reactivity (a.fft[0-3]).
 *
 * This works by intercepting the AudioContext destination chain:
 * Strudel AudioWorklet -> GainNode -> AnalyserNode -> AudioContext.destination
 *
 * The AnalyserNode captures frequency data without affecting audio playback.
 */
export function initHydraBridge(audioContext: AudioContext): HydraBridge | null {
    if (!audioContext) {
        console.error('No AudioContext provided to bridge');
        return null;
    }

    // Create the analyser node that will capture frequency data
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;

    // Create a gain node to sit between Strudel's output and the analyser
    // This will be the new "destination" for Strudel's audio
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    // Connect the chain: GainNode -> AnalyserNode -> Destination
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const hydraAudio: HydraBridge = {
        analyser,
        gainNode,
        bins: 4,
        fft: Array(4).fill(0),
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
                return avg / 255; // normalize 0-1
            });
        },
        disconnect: () => {
            gainNode.disconnect();
            analyser.disconnect();
        }
    };

    // Expose the audio object globally so Hydra code can access a.fft
    (window as any).a = hydraAudio;

    // Start the animation loop to continuously update FFT data
    const tick = () => {
        hydraAudio.tick();
        requestAnimationFrame(tick);
    };
    tick();

    console.log('✅ Audio bridge initialized - Strudel audio will feed Hydra a.fft', {
        analyser,
        gainNode,
        fftSize: analyser.fftSize,
        frequencyBinCount: analyser.frequencyBinCount
    });

    return hydraAudio;
}
