import { useEffect, useRef } from 'react';
import Hydra from 'hydra-synth';

type Props = {
    className?: string;
    /**
     * Optional shared AudioContext from Strudel. If not provided, Hydra will create its own.
     */
    audioContext?: AudioContext | null;
    /**
     * Optional Uint8Array of frequency data from an AnalyserNode.
     */
    audioData?: Uint8Array;
    /**
     * Visual mode selector – can be used to switch shader behaviours.
     */
    visualMode?: 'default' | 'bass';
    /**
     * Callback when Hydra is initialized.
     */
    onInit?: (synth: any) => void;
};

export default function HydraCanvas(props: Props) {
    const { className, audioContext } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hydraInstance = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || !audioContext) return;

        const canvas = canvasRef.current;

        // Set canvas resolution to match its display size for crisp rendering
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;

        // If an instance already exists, we might need to clean it up or just update it.
        // Since Hydra doesn't support hot-swapping audio context easily, we'll recreate it.
        // We try to be gentle by hushing the old one if it exists.
        if (hydraInstance.current) {
            try {
                hydraInstance.current.hush();
            } catch (e) {
                console.warn("Failed to hush previous Hydra instance", e);
            }
        }

        // Initialise Hydra
        const hydra = new Hydra({
            canvas: canvas,
            audioContext,
            detectAudio: false,
            makeGlobal: true,
            enableStreamCapture: false,
            width: canvas.width,
            height: canvas.height,
        });

        hydraInstance.current = hydra;

        if (props.onInit) {
            props.onInit(hydra);
        }

        // Expose Hydra globals for debugging
        if (typeof window !== 'undefined') {
            console.log("Hydra initialized:", hydra);
            (window as any).hydra = hydra;
            (window as any).h = hydra;
            // 'a' should be automatically exposed by makeGlobal: true, but let's force it if needed
            // In some versions 'a' is on the hydra instance, in others it's internal.
            // We'll try to find it.
            if ((hydra as any).a) {
                (window as any).a = (hydra as any).a;
                console.log("Exposed 'a' from hydra.a");
            } else if ((hydra as any).audio) {
                // Sometimes it's hydra.audio
                (window as any).a = (hydra as any).audio;
                console.log("Exposed 'a' from hydra.audio");
            }
        }

        // Hydra initialized. Waiting for commands from REPL.

        const handleResize = () => {
            if (hydraInstance.current && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                canvasRef.current.width = rect.width * window.devicePixelRatio;
                canvasRef.current.height = rect.height * window.devicePixelRatio;
                hydraInstance.current.setResolution(canvasRef.current.width, canvasRef.current.height);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            // Hydra does not expose a formal destroy API; letting the instance be GC'd is fine.
        };
    }, [audioContext]);

    // Update visuals when audioData or visualMode changes
    // Visual updates are now handled entirely by the REPL executing code against the hydra instance.
    // We no longer automatically update visuals based on props to avoid overwriting user code.

    return <canvas ref={canvasRef} className={`block w-full h-full object-cover ${className}`} />;
}
