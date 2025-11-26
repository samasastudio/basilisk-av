export type HydraBridgeOptions = {
    /** Shared audio context from Strudel */
    audioContext: AudioContext;
    /** Hydra instance returned by the HydraCanvas */
    hydra: any;
    /**
     * Source node that carries Strudel's output. If not provided, the bridge will
     * try to tap into window.repl.output when available.
     */
    sourceNode?: AudioNode | null;
    analyserOptions?: {
        fftSize?: number;
        smoothingTimeConstant?: number;
    };
};

export type HydraBridgeResult = {
    analyser: AnalyserNode;
    hydraAudio: HydraAudioProxy;
};

type HydraAudioProxy = {
    fft: number[];
    vol: number;
    setBins: (numBins: number) => void;
    tick: () => void;
};

// A small, dependency-free reimplementation of the Strudel -> Hydra audio bridge.
// It mirrors the public shape of Hydra's `a` analyser, but sources audio from the
// provided AudioContext instead of the microphone.
export async function initHydra(options: HydraBridgeOptions): Promise<HydraBridgeResult> {
    const { audioContext, hydra, sourceNode, analyserOptions } = options;

    if (!audioContext || !hydra) {
        throw new Error('Hydra bridge requires both an audioContext and hydra instance.');
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = analyserOptions?.fftSize ?? 512;
    analyser.smoothingTimeConstant = analyserOptions?.smoothingTimeConstant ?? 0.8;

    const tappedSource: AudioNode | null = sourceNode ?? (window as any)?.repl?.output ?? null;
    try {
        tappedSource?.connect(analyser);
    } catch (e) {
        console.warn('Unable to connect Strudel output to Hydra analyser', e);
    }

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    const hydraAudio: HydraAudioProxy = {
        fft: [0, 0, 0, 0],
        vol: 0,
        setBins: (numBins: number) => {
            const bins = Math.max(1, numBins);
            hydraAudio.fft = Array(bins).fill(0);
        },
        tick: () => {
            analyser.getByteFrequencyData(frequencyData);
            const bins = hydraAudio.fft.length;
            const binSize = Math.max(1, Math.floor(frequencyData.length / bins));

            let total = 0;
            hydraAudio.fft = hydraAudio.fft.map((_, index) => {
                const start = index * binSize;
                const end = index === bins - 1 ? frequencyData.length : start + binSize;
                let sum = 0;
                for (let i = start; i < end; i++) {
                    sum += frequencyData[i];
                }
                const avg = sum / Math.max(1, end - start);
                const normalized = avg / 255; // 0..1 range
                total += normalized;
                return normalized;
            });

            hydraAudio.vol = total / bins;
        },
    };

    // Expose to Hydra and global scope
    const synth = (hydra as any).synth ?? hydra;
    if (!synth) {
        throw new Error('Hydra instance did not expose a synth to attach audio analyser.');
    }

    // This patch stage is intentionally small so hot reloads are tolerant of Hydra versions.
    synth.a = hydraAudio;
    const previousUpdate = synth.update;
    synth.update = (dt: number) => {
        hydraAudio.tick();
        previousUpdate?.(dt);
    };

    if (typeof window !== 'undefined') {
        (window as any).a = hydraAudio;
    }

    return { analyser, hydraAudio };
}

export async function initHydraBridge(options: HydraBridgeOptions): Promise<HydraBridgeResult> {
    return initHydra(options);
}
