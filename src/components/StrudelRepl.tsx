import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { samples } from '@strudel/webaudio';
import * as Strudel from '@strudel/core';

// Expose Strudel functions globally for the REPL
Object.assign(window, Strudel, { samples });

// Strudel Pattern
// The audio object 'a' is automatically available for Hydra
const defaultCode = `// Test pattern: kick and snare
$: s("bd sd").gain(0.8)`;

export default function StrudelRepl({ className, engineReady }: { className?: string; engineReady: boolean }) {
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
            console.log("Evaluating code:", code);
            // Sanitize code: remove comments and trailing semicolon
            const cleanCode = code
                .replace(/\/\/.*$/gm, '') // Remove line comments
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
                .trim();

            const finalCode = cleanCode.endsWith(';') ? cleanCode.slice(0, -1) : cleanCode;

            repl.evaluate(finalCode);
        } catch (e) {
            console.error("Strudel Error:", e);
        }
    };

    const stopCode = () => {
        const repl = (window as any).repl;
        if (repl && repl.stop) {
            repl.stop();
        }
    };

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex justify-between items-center p-2 bg-pm-panel border-b border-pm-border select-none">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <span className="text-pm-accent font-mono text-sm tracking-wider">STRUDEL_CORE</span>
                </div>
                <div className="space-x-2 font-mono text-xs">
                    <button
                        onClick={runCode}
                        disabled={!engineReady}
                        title={engineReady ? 'Execute code (Shift+Enter)' : 'Please start the engine first'}
                        className={`px-3 py-1 transition-colors border border-pm-border ${engineReady
                            ? 'bg-pm-border hover:bg-pm-accent hover:text-black cursor-pointer'
                            : 'bg-pm-border/50 text-gray-600 cursor-not-allowed'
                            }`}
                    >
                        EXECUTE
                    </button>
                    <button
                        onClick={stopCode}
                        className="px-3 py-1 bg-pm-border hover:bg-red-500 hover:text-black transition-colors border border-pm-border"
                    >
                        HALT
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden bg-pm-bg relative">
                <CodeMirror
                    value={code}
                    height="100%"
                    theme="dark"
                    extensions={[javascript()]}
                    onChange={(val) => setCode(val)}
                    className="h-full text-sm font-mono"
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
