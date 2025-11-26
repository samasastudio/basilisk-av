import React, { useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { Play } from 'lucide-react';

type Props = {
    className?: string;
    onExecute: (code: string) => void;
    initialCode?: string;
    audioLinked?: boolean;
    onLoadAudioTest?: () => void;
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

const AUDIO_TEST = `// Hydra audio test using a.fft
a.setBins(4)

osc(10, 0, () => a.fft[0] * 4)
  .rotate(0, () => a.fft[1] * 0.3)
  .modulateScale(noise(3, 0.1), () => a.fft[2] * 0.2)
  .out()`;

export default function HydraRepl({ className, onExecute, initialCode = DEFAULT_CODE, audioLinked, onLoadAudioTest }: Props) {
    const [code, setCode] = useState(initialCode);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onExecute(code);
        }
    }, [code, onExecute]);

    const loadPreset = (preset: 'default' | 'audio') => {
        if (preset === 'audio') {
            setCode(AUDIO_TEST);
            onLoadAudioTest?.();
        } else {
            setCode(DEFAULT_CODE);
        }
    };

    return (
        <div className={`flex flex-col bg-pm-panel ${className}`}>
            <div className="flex flex-col gap-2 p-2 border-b border-pm-border select-none bg-pm-panel">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
                        <span className="text-pm-secondary font-mono text-sm tracking-wider">HYDRA_VISUALS</span>
                    </div>
                    <button
                        onClick={() => onExecute(code)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-pm-border hover:bg-pm-accent hover:text-black transition-colors rounded"
                        title="Run Code (Ctrl+Enter)"
                    >
                        <Play size={10} />
                        RUN
                    </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-pm-secondary">
                    <div className="flex items-center gap-2">
                        <span className="uppercase tracking-wide">Hydra audio source:</span>
                        <span className="text-white">{audioLinked ? 'Strudel (a.fft)' : 'Not linked'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="px-2 py-1 border border-pm-border rounded hover:bg-pm-border/80"
                            onClick={() => loadPreset('default')}
                        >
                            Load Default
                        </button>
                        <button
                            className="px-2 py-1 border border-pm-border rounded hover:bg-pm-accent hover:text-black"
                            onClick={() => loadPreset('audio')}
                        >
                            Hydra audio test (a.fft)
                        </button>
                    </div>
                </div>
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
