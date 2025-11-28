import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { samples } from '@strudel/webaudio';
import * as Strudel from '@strudel/core';
import { initHydra, H } from '@strudel/hydra';
import Button from './ui/Button';

// Expose Strudel functions globally for the REPL
Object.assign(window, Strudel, { samples, initHydra, H });

const defaultCode = `// Initialize Hydra (no microphone needed!)
await initHydra()

// Audio-reactive visual - reacts to Strudel's output
osc(10, 0.1, () => a.fft[0] * 2)
  .rotate(() => a.fft[1], 0.1)
  .kaleid(4)
  .out()

// Strudel audio pattern
s("bd sd, hh*8, ~ sd")`;

type Props = {
    className?: string;
    engineReady: boolean;
    onTestPattern?: () => void;
    onHalt?: () => void;
    statusLabel?: string;
};

export default function StrudelRepl({ className, engineReady, onTestPattern, onHalt, statusLabel }: Props) {
    const [code, setCode] = useState(defaultCode);

    const runCode = async () => {
        if (!engineReady) {
            console.warn('Engine not ready. Please start the engine first.');
            return;
        }

        const repl = (window as any).repl;
        if (!repl || !repl.evaluate) {
            console.error('Strudel REPL not found. Make sure engine is started.');
            return;
        }

        try {
            await repl.evaluate(code);
        } catch (e) {
            console.error("Evaluation Error:", e);
        }
    };

    const stopCode = () => {
        if (onHalt) {
            onHalt();
            return;
        }
        const repl = (window as any).repl;
        if (repl && repl.stop) {
            repl.stop();
        }
    };

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex justify-between items-center px-4 py-2 bg-basilisk-gray-900/85 backdrop-blur border-b border-basilisk-gray-700 select-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-basilisk-accent-cool"></div>
                    <span className="font-sans font-medium text-sm text-basilisk-white">Editor</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded font-sans ${engineReady ? 'bg-basilisk-success/20 text-basilisk-success' : 'bg-basilisk-warning/20 text-basilisk-warning'}`}>
                        {statusLabel ?? (engineReady ? 'Engine: ready' : 'Engine: stopped')}
                    </span>
                    <Button
                        onClick={runCode}
                        disabled={!engineReady}
                        variant="accent-cool"
                        size="sm"
                    >
                        Execute
                    </Button>
                    <Button
                        onClick={stopCode}
                        variant="secondary"
                        size="sm"
                    >
                        Halt
                    </Button>
                    <Button
                        onClick={onTestPattern}
                        disabled={!engineReady}
                        variant="secondary"
                        size="sm"
                    >
                        Test
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden bg-basilisk-near-black relative">
                <CodeMirror
                    value={code}
                    height="100%"
                    theme="dark"
                    extensions={[javascript()]}
                    onChange={(val) => setCode(val)}
                    className="h-full text-base font-mono"
                    onKeyDown={(e) => {
                        if (e.shiftKey && e.key === 'Enter') {
                            e.preventDefault();
                            runCode();
                        }
                    }}
                />
            </div>
        </div>
    );
}
