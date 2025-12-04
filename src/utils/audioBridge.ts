// Extend Window interface for webkit-prefixed AudioContext
declare global {
    interface Window {
        webkitAudioContext?: typeof AudioContext;
    }
}

export class AudioBridge {
    context: AudioContext;
    analyser: AnalyserNode;
    source: MediaStreamAudioSourceNode | null = null;

    destination: MediaStreamAudioDestinationNode;

    constructor() {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) {
            throw new Error('AudioContext is not supported in this browser');
        }
        this.context = new AudioContextConstructor();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.8;
        this.destination = this.context.createMediaStreamDestination();

        // Connect analyser to destination so anything connected to analyser goes to stream
        // But wait, we want Strudel -> Analyser -> Destination (for Hydra) AND Speakers
        // We'll rely on Strudel connecting to Context.destination (Speakers)
        // We need to tap into it. 
        // Since we can't easily tap the final output of Strudel without its cooperation,
        // We might need a different approach if Strudel doesn't expose output.
        // For now, let's assume we can just use the context's destination if we could loopback, but we can't.
        // Alternative: We'll try to hijack the context.destination? No.

        // Let's just expose the context and hope Strudel uses it.
        // If Strudel connects to context.destination, we can't read from it.
        // We need Strudel to connect to a node we control.
    }

    init(): void {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    getAnalyser(): AnalyserNode {
        return this.analyser;
    }
}

export const audioBridge = new AudioBridge();
