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

// Minimal audio-reactive visual (Algorithmic Minimalism)
osc(2, 0.02, 0)
  .rotate(0.01)
  .modulateScale(osc(0.5), () => a.fft[0] * 0.3)
  .out()

// Strudel audio pattern
s("bd sd, hh*4, ~ sd")`;

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
            <div className="flex justify-between items-center px-4 py-2 bg-basilisk-gray-900/70 backdrop-blur-md border-b border-basilisk-gray-700/50 select-none shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-basilisk-white"></div>
                    <span className="font-sans font-medium text-sm text-basilisk-white">Editor</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded font-sans bg-basilisk-gray-800/50 text-basilisk-white border border-basilisk-gray-700 flex items-center gap-1.5">
                        <span className="text-base leading-none">{engineReady ? '●' : '○'}</span>
                        {statusLabel ?? (engineReady ? 'Engine: ready' : 'Engine: stopped')}
                    </span>
                    <Button
                        onClick={runCode}
                        disabled={!engineReady}
                        variant="primary"
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
            <div className="flex-1 overflow-hidden bg-basilisk-near-black/85 backdrop-blur-sm relative border-t border-basilisk-gray-800/30">
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
