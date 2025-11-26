import React, { useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { Play } from 'lucide-react';

type Props = {
    className?: string;
    onExecute: (code: string) => void;
    initialCode?: string;
    onLoadPreset?: (code: string) => void;
    linkStatus?: string;
};

const DEFAULT_CODE = `// Hydra Visuals
// Ctrl+Enter to run

// "Egg of the Phoenix" by Alexandre Rangel
speed = 1.2
shape(99, .15, .5)
  .color(0, 1, 2)
  .diff(shape(240, .5, 0).scrollX(.05).rotate(() => time / 10).color(1, 0, .75))
  .diff(shape(99, .4, .002).scrollX(.10).rotate(() => time / 20).color(1, 0, .75))
  .diff(shape(99, .3, .002).scrollX(.15).rotate(() => time / 30).color(1, 0, .75))
  .diff(shape(99, .2, .002).scrollX(.20).rotate(() => time / 40).color(1, 0, .75))
  .diff(shape(99, .1, .002).scrollX(.25).rotate(() => time / 50).color(1, 0, .75))
  .modulateScale(
      shape(240, .5, 0).scrollX(.05).rotate(() => time / 10),
      () => (Math.sin(time / 3) * .2) + .2
  )
  .scale(1.6, .6, 1)
  .out()`;

const AUDIO_TEST = `a.setBins(4)

osc(10, 0, () => a.fft[0] * 4)
  .rotate(0, () => a.fft[1] * 0.3)
  .modulateScale(noise(3, 0.1), () => a.fft[2] * 0.2)
  .out()`;

const SIMPLE_FEEDBACK = `osc(5, 0.1, 0.8)
  .rotate(0.1, 0.05)
  .modulate(noise(2, 0.2), 0.2)
  .out()`;

const presetMap: Record<string, string> = {
    none: DEFAULT_CODE,
    audio: AUDIO_TEST,
    feedback: SIMPLE_FEEDBACK,
};

export default function HydraRepl({ className, onExecute, initialCode = DEFAULT_CODE, onLoadPreset, linkStatus }: Props) {
    const [code, setCode] = useState(initialCode);
    const [preset, setPreset] = useState<'none' | 'audio' | 'feedback'>('none');

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onExecute(code);
        }
    }, [code, onExecute]);

    const loadPreset = (value: 'none' | 'audio' | 'feedback') => {
        setPreset(value);
        const presetCode = presetMap[value];
        setCode(presetCode);
        (onLoadPreset ?? onExecute)(presetCode);
    };

    return (
        <div className={`flex flex-col bg-pm-panel ${className}`}>
            <div className="flex justify-between items-center p-2 border-b border-pm-border select-none bg-pm-panel">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
                    <span className="text-pm-secondary font-mono text-sm tracking-wider">HYDRA_VISUALS</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-pm-secondary">{linkStatus ?? 'Hydra audio source: unknown'}</span>
                    <button
                        onClick={() => onExecute(code)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-pm-border hover:bg-pm-accent hover:text-black transition-colors rounded"
                        title="Run Code (Ctrl+Enter)"
                    >
                        <Play size={10} />
                        RUN
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-2 text-xs border-b border-pm-border bg-black/30">
                <span className="text-pm-secondary">Presets:</span>
                <button
                    className={`px-2 py-1 rounded border ${preset === 'audio' ? 'bg-pm-accent text-black border-pm-accent' : 'border-pm-border'}`}
                    onClick={() => loadPreset('audio')}
                >
                    Hydra audio test (a.fft)
                </button>
                <button
                    className={`px-2 py-1 rounded border ${preset === 'feedback' ? 'bg-pm-accent text-black border-pm-accent' : 'border-pm-border'}`}
                    onClick={() => loadPreset('feedback')}
                >
                    Simple feedback
                </button>
                <button
                    className={`px-2 py-1 rounded border ${preset === 'none' ? 'bg-pm-accent text-black border-pm-accent' : 'border-pm-border'}`}
                    onClick={() => loadPreset('none')}
                >
                    Reset
                </button>
            </div>
            <div className="flex-1 overflow-hidden relative" onKeyDown={handleKeyDown}>
                <CodeMirror
                    value={code}
                    height="100%"
                    theme="dark"
                    extensions={[javascript()]}
                    onChange={(val) => setCode(val)}
                    className="h-full text-sm font-mono"
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: false,
                        highlightActiveLine: true,
                    }}
                />
            </div>
        </div>
    );
}
