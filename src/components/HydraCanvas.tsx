import { useEffect, useRef } from 'react';
import Hydra from 'hydra-synth';

type Props = {
    className?: string;
    /**
     * Optional shared AudioContext from Strudel. If not provided, Hydra will create its own.
     */
    audioContext?: AudioContext;
    /**
     * Optional Uint8Array of frequency data from an AnalyserNode.
     */
    audioData?: Uint8Array;
    /**
     * Visual mode selector – can be used to switch shader behaviours.
     */
    visualMode?: 'default' | 'bass';
};

export default function HydraCanvas(props: Props) {
    const { className, audioContext } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hydraInstance = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || hydraInstance.current) return;

        const canvas = canvasRef.current;

        // Set canvas resolution to match its display size for crisp rendering
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;

        // Initialise Hydra scoped to this component (no global namespace pollution)
        hydraInstance.current = new Hydra({
            canvas: canvas,
            audioContext,
            detectAudio: false, // Strudel handles audio
            makeGlobal: false,
            enableStreamCapture: false,
            width: canvas.width,
            height: canvas.height,
        }).synth;

        // Initial visual: "Egg of the Phoenix" by Alexandre Rangel
        // Licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
        // www.alexandrerangel.art.br/hydra.html
        hydraInstance.current.speed = 1.2;

        hydraInstance.current
            .shape(99, .15, .5)
            .color(0, 1, 2)
            .diff(hydraInstance.current.shape(240, .5, 0).scrollX(.05).rotate(() => hydraInstance.current.time / 10).color(1, 0, .75))
            .diff(hydraInstance.current.shape(99, .4, .002).scrollX(.10).rotate(() => hydraInstance.current.time / 20).color(1, 0, .75))
            .diff(hydraInstance.current.shape(99, .3, .002).scrollX(.15).rotate(() => hydraInstance.current.time / 30).color(1, 0, .75))
            .diff(hydraInstance.current.shape(99, .2, .002).scrollX(.20).rotate(() => hydraInstance.current.time / 40).color(1, 0, .75))
            .diff(hydraInstance.current.shape(99, .1, .002).scrollX(.25).rotate(() => hydraInstance.current.time / 50).color(1, 0, .75))
            .modulateScale(
                hydraInstance.current.shape(240, .5, 0).scrollX(.05).rotate(() => hydraInstance.current.time / 10),
                () => (Math.sin(hydraInstance.current.time / 3) * .2) + .2
            )
            .scale(1.6, .6, 1)
            .out();

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
    useEffect(() => {
        if (!hydraInstance.current || !props.audioData) return;

        const avgAmplitude = props.audioData.reduce((sum: number, val: number) => sum + val, 0) / props.audioData.length / 255;
        const mode = props.visualMode ?? 'default';

        if (mode === 'bass') {
            // Bass-responsive: modulate speed and scale of the Phoenix
            hydraInstance.current.speed = 1.2 + avgAmplitude * 2;

            hydraInstance.current
                .shape(99, .15, .5)
                .color(0, 1, 2)
                .diff(hydraInstance.current.shape(240, .5, 0).scrollX(.05).rotate(() => hydraInstance.current.time / 10).color(1, 0, .75))
                .diff(hydraInstance.current.shape(99, .4, .002).scrollX(.10).rotate(() => hydraInstance.current.time / 20).color(1, 0, .75))
                .diff(hydraInstance.current.shape(99, .3, .002).scrollX(.15).rotate(() => hydraInstance.current.time / 30).color(1, 0, .75))
                .diff(hydraInstance.current.shape(99, .2, .002).scrollX(.20).rotate(() => hydraInstance.current.time / 40).color(1, 0, .75))
                .diff(hydraInstance.current.shape(99, .1, .002).scrollX(.25).rotate(() => hydraInstance.current.time / 50).color(1, 0, .75))
                .modulateScale(
                    hydraInstance.current.shape(240, .5, 0).scrollX(.05).rotate(() => hydraInstance.current.time / 10),
                    () => (Math.sin(hydraInstance.current.time / 3) * .2) + .2 + avgAmplitude * 0.5
                )
                .scale(1.6 + avgAmplitude * 0.4, .6 + avgAmplitude * 0.2, 1)
                .out();
        } else {
            // Default: subtle speed modulation
            hydraInstance.current.speed = 1.2 + avgAmplitude * 0.3;

            hydraInstance.current
                .shape(99, .15, .5)
                .color(0, 1, 2)
                .diff(hydraInstance.current.shape(240, .5, 0).scrollX(.05).rotate(() => hydraInstance.current.time / 10).color(1, 0, .75))
                .diff(hydraInstance.current.shape(99, .4, .002).scrollX(.10).rotate(() => hydraInstance.current.time / 20).color(1, 0, .75))
                .diff(hydraInstance.current.shape(99, .3, .002).scrollX(.15).rotate(() => hydraInstance.current.time / 30).color(1, 0, .75))
                .diff(hydraInstance.current.shape(99, .2, .002).scrollX(.20).rotate(() => hydraInstance.current.time / 40).color(1, 0, .75))
                .diff(hydraInstance.current.shape(99, .1, .002).scrollX(.25).rotate(() => hydraInstance.current.time / 50).color(1, 0, .75))
                .modulateScale(
                    hydraInstance.current.shape(240, .5, 0).scrollX(.05).rotate(() => hydraInstance.current.time / 10),
                    () => (Math.sin(hydraInstance.current.time / 3) * .2) + .2
                )
                .scale(1.6, .6, 1)
                .out();
        }
    }, [props.audioData, props.visualMode]);

    return <canvas ref={canvasRef} className={`block w-full h-full object-cover ${className}`} />;
}
