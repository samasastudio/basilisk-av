import Hydra from 'hydra-synth';
import { useEffect, useRef } from 'react';

import type { HydraSynth } from '../types/hydra';

type Props = {
    className?: string;
    /**
     * Callback when Hydra is initialized.
     */
    onInit?: (hydra: HydraSynth) => void;
    /**
     * Optional shared AudioContext from Strudel. If not provided, Hydra will create its own.
     */
    audioContext?: AudioContext;
};

export function HydraCanvas(props: Props): JSX.Element {
    const { className, audioContext } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hydraInstance = useRef<HydraSynth | null>(null);

    useEffect(() => {
        if (!canvasRef.current) {return;}

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
            canvas,
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
            window.hydra = hydra as HydraSynth;
            window.h = hydra as HydraSynth;
            // 'a' should be automatically exposed by makeGlobal: true, but let's force it if needed
            // In some versions 'a' is on the hydra instance, in others it's internal.
            // We'll try to find it.
            const hydraSynth = hydra as HydraSynth;
            if (hydraSynth.a) {
                window.a = hydraSynth.a;
            } else if (hydraSynth.audio) {
                // Sometimes it's hydra.audio
                window.a = hydraSynth.audio;
            }
        }

        // Set up audio tick loop - this updates a.fft values every frame
        let animationId: number;
        const tickAudio = (): void => {
            if (window.a?.tick) {
                window.a.tick();
            }
            animationId = requestAnimationFrame(tickAudio);
        };
        tickAudio();

        // Hydra initialized. Waiting for commands from REPL.

        const handleResize = (): void => {
            if (hydraInstance.current && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                canvasRef.current.width = rect.width * window.devicePixelRatio;
                canvasRef.current.height = rect.height * window.devicePixelRatio;
                // Type assertion needed as setResolution is not in our type definition
                (hydraInstance.current as Record<string, unknown>).setResolution?.(canvasRef.current.width, canvasRef.current.height);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            // Hydra does not expose a formal destroy API; letting the instance be GC'd is fine.
        };
    }, [audioContext]);

    // Update visuals when audioData or visualMode changes
    // Visual updates are now handled entirely by the REPL executing code against the hydra instance.
    // We no longer automatically update visuals based on props to avoid overwriting user code.

    return <canvas ref={canvasRef} className={`block w-full h-full object-cover ${className}`} />;
}
