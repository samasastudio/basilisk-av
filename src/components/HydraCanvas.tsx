// HydraCanvas.tsx – renders a Hydra canvas and wires Strudel audio output
import { useEffect, useRef } from 'react';
import Hydra from 'hydra-synth';

/** Props for the Hydra canvas component */
type Props = {
    className?: string;
    /** Optional shared AudioContext from Strudel */
    audioContext?: AudioContext;
    /** Optional Uint8Array of frequency data from an AnalyserNode */
    audioData?: Uint8Array;
    /** Visual mode selector – can be used to switch shader behaviours */
    visualMode?: 'default' | 'bass';
    /** Callback when Hydra is initialized */
    onInit?: (synth: any) => void;
};

export default function HydraCanvas({ className, audioContext, onInit }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hydraInstance = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        // Set canvas resolution to match display size for crisp rendering
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;

        // Clean up any previous Hydra instance
        if (hydraInstance.current) {
            try {
                hydraInstance.current.hush();
            } catch (e) {
                console.warn('Failed to hush previous Hydra instance', e);
            }
        }

        // Initialise Hydra – disable its own microphone capture
        const hydra = new Hydra({
            canvas,
            audioContext,
            detectAudio: false,
            makeGlobal: true,
            enableStreamCapture: false,
            width: canvas.width,
            height: canvas.height,
        });

        hydraInstance.current = hydra;
        if (onInit) onInit(hydra.synth);

        // Expose globals for debugging / user code (a, h, hydra)
        if (typeof window !== 'undefined') {
            (window as any).hydra = hydra;
            (window as any).h = hydra;
            // `a` is exposed by makeGlobal, but ensure it exists
            if ((hydra as any).a) {
                (window as any).a = (hydra as any).a;
            } else if ((hydra as any).audio) {
                (window as any).a = (hydra as any).audio;
            }
        }

        // Resize handling – keep canvas and Hydra resolution in sync
        const handleResize = () => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            canvasRef.current.width = rect.width * window.devicePixelRatio;
            canvasRef.current.height = rect.height * window.devicePixelRatio;
            hydraInstance.current?.setResolution(canvasRef.current.width, canvasRef.current.height);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [audioContext]);

    return (
        <canvas
            ref={canvasRef}
            className={className ? `block w-full h-full object-cover ${className}` : 'block w-full h-full object-cover'}
        />
    );
}
