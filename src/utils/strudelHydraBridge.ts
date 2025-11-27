export type HydraLike = {
    synth: any;
    detectAudio: boolean;
};

export type StrudelReplLike = {
    output?: AudioNode;
    audioContext?: AudioContext;
    context?: AudioContext;
};

export type HydraBridge = {
    analyser: AnalyserNode;
    fft: number[];
    bins: number;
    tick: () => void;
    setBins: (bins: number) => void;
};

/**
 * Minimal bridge that feeds Hydra's `a.fft` values from Strudel's audio output.
 * This avoids Hydra's microphone-based audio detection while keeping a single audio graph.
 */
export function initHydraBridge({
    hydra,
    strudel,
    audioContext,
}: {
    hydra: HydraLike;
    strudel: StrudelReplLike;
    audioContext: AudioContext;
}): HydraBridge | null {
    if (!hydra || !strudel?.output || !audioContext) return null;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;

    try {
        strudel.output.connect(analyser);
    } catch (err) {
        console.warn('Unable to connect Strudel output to Hydra analyser', err);
        return null;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const hydraAudio: HydraBridge = {
        analyser,
        bins: 4,
        fft: Array(4).fill(0),
        setBins: (bins: number) => {
            hydraAudio.bins = Math.max(1, bins);
            hydraAudio.fft = Array(hydraAudio.bins).fill(0);
        },
        tick: () => {
            // Skip ticking if in test mode
            if ((hydraAudio as any).testMode) return;

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
    };

    // Wire into Hydra's audio slot and tick loop
    hydra.synth.a = hydraAudio;
    hydra.detectAudio = true;

    // expose for debugging
    (window as any).a = hydraAudio;
    return hydraAudio;
}
