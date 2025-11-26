import React, { useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { Play } from 'lucide-react';

type Props = {
    className?: string;
    onExecute: (code: string) => void;
    initialCode?: string;
};

const DEFAULT_CODE = `// Audio-Reactive Hydra Visuals
// Ctrl+Enter to run
// IMPORTANT: Run the Strudel code first to initialize audio!

// Check if 'a' is initialized
if (typeof a !== 'undefined') {
  a.setBins(4)
  
  osc(10, 0, () => a.fft[0] * 4)
    .rotate(0, () => a.fft[1] * 0.3)
    .modulateScale(
      noise(3, 0.1), 
      () => a.fft[2] * 0.2
    )
    .color(
      () => a.fft[0] * 2,
      () => a.fft[1] * 1.5,
      () => a.fft[2] * 3
    )
    .out()
} else {
  // Fallback: non-audio-reactive visual
  osc(10, 0.1, 2)
    .kaleid(4)
    .color(1, 0.5, 0.8)
    .out()
}`;

export default function HydraRepl({ className, onExecute, initialCode = DEFAULT_CODE }: Props) {
    const [code, setCode] = useState(initialCode);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onExecute(code);
        }
    }, [code, onExecute]);

    return (
        <div className={`flex flex-col bg-pm-panel ${className}`}>
            <div className="flex justify-between items-center p-2 border-b border-pm-border select-none bg-pm-panel">
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
