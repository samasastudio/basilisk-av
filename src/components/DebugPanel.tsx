// DebugPanel.tsx – provides UI for testing Strudel audio and Hydra visual response
import { useEffect, useState } from 'react';

type Props = {
    onPlayStrudel?: () => void;
    onLoadHydraTest?: () => void;
};

export default function DebugPanel({ onPlayStrudel, onLoadHydraTest }: Props) {
    const [fftValue, setFftValue] = useState<number | undefined>(undefined);

    // Update FFT value from Hydra's analyser (a.fft) at ~5Hz
    useEffect(() => {
        let animation: number;
        const update = () => {
            const a = (window as any).a;
            if (a && a.fft && a.fft.length) {
                setFftValue(a.fft[0]);
            }
            animation = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(animation);
    }, []);

    return (
        <div className="flex gap-4 items-center p-2 bg-pm-panel border-t border-pm-border">
            <button
                onClick={onPlayStrudel}
                className="px-3 py-1 bg-pm-border hover:bg-pm-accent text-sm"
            >
                Play Strudel Test Pattern
            </button>
            <button
                onClick={onLoadHydraTest}
                className="px-3 py-1 bg-pm-border hover:bg-pm-accent text-sm"
            >
                Load Hydra Audio Test
            </button>
            <div className="text-xs text-pm-secondary ml-4">
                a.fft[0]: {fftValue !== undefined ? fftValue.toFixed(1) : '—'}
            </div>
        </div>
    );
}
