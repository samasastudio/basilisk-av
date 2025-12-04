import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import * as Strudel from '@strudel/core';
import { initHydra, H } from '@strudel/hydra';
import { samples } from '@strudel/webaudio';
import CodeMirror from '@uiw/react-codemirror';
import { useState } from 'react';

import { Button } from './ui/Button';

// Expose Strudel functions globally for the REPL
Object.assign(window, Strudel, { samples, initHydra, H });

// Transparent glassmorphic theme for CodeMirror
const transparentTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent !important',
    height: '100%'
  },
  '.cm-scroller': {
    backgroundColor: 'transparent !important',
    fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Consolas, Monaco, monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
  },
  '.cm-scroller::-webkit-scrollbar': {
    width: '8px',
    height: '8px'
  },
  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'transparent'
  },
  '.cm-scroller::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    border: '2px solid transparent',
    backgroundClip: 'padding-box'
  },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },
  '.cm-gutters': {
    backgroundColor: 'transparent !important',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: 'none',
    borderRight: '1px solid rgba(71, 85, 105, 0.3)'
  },
  '.cm-gutter, .cm-lineNumbers': {
    backgroundColor: 'rgba(15, 23, 42, 0.15) !important',
    color: 'rgba(255, 255, 255, 0.65) !important'
  },
  '.cm-gutterElement': {
    color: 'rgba(255, 255, 255, 0.65) !important'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
    borderRadius: '2px'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  '.cm-content': {
    caretColor: '#ffffff',
    color: 'rgba(255, 255, 255, 0.95)',
    padding: '8px 0'
  },
  '.cm-line': {
    color: 'rgba(255, 255, 255, 0.95) !important'
  },
  '.cm-cursor': {
    borderLeftColor: '#ffffff'
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(255, 255, 255, 0.2) !important'
  }
});

const defaultCode = `// Initialize Hydra
await initHydra({
  width: window.innerWidth,
  height: window.innerHeight
})

// Audio-reactive kaleidoscope (Algorithmic Minimalism)
osc(3.762, () => (a.fft[3] * 0.05) + 0.01, -3.794)
    .rotate()
    .kaleid()
    .colorama(() => a.fft[0] / 1e4)
    .pixelate(128)
    .out();

// Audio pattern
s("bd sd, hh*4")`;

type Props = {
    className?: string;
    engineReady: boolean;
    onTestPattern?: () => void;
    onHalt?: () => void;
    onExecute?: () => void;
    statusLabel?: string;
};

export function StrudelRepl({ className, engineReady, onTestPattern, onHalt, onExecute, statusLabel }: Props): JSX.Element {
    const [code, setCode] = useState(defaultCode);

    const runCode = async (): Promise<void> => {
        if (!engineReady) {
            console.warn('Engine not ready. Please start the engine first.');
            return;
        }

        const repl = window.repl;
        if (!repl?.evaluate) {
            console.error('Strudel REPL not found. Make sure engine is started.');
            return;
        }

        try {
            await repl.evaluate(code);
            if (onExecute) {
                onExecute();
            }
        } catch (e) {
            console.error("Evaluation Error:", e);
        }
    };

    const stopCode = (): void => {
        if (onHalt) {
            onHalt();
            return;
        }
        const repl = window.repl;
        if (repl?.stop) {
            repl.stop();
        }
    };

    return (
        <div className={`flex flex-col h-full w-full ${className ?? ''}`}>
            <div className="drag-handle h-10 flex items-center justify-between px-3 bg-basilisk-gray-800/50 border-b border-basilisk-gray-700 cursor-move flex-shrink-0">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-basilisk-gray-400">{engineReady ? '●' : '○'}</span>
                    <span className="text-basilisk-gray-400">{statusLabel ?? 'Editor'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Button onClick={runCode} disabled={!engineReady} variant="secondary" size="sm">
                        Execute ▶
                    </Button>
                    <Button onClick={stopCode} variant="secondary" size="sm">
                        Halt ■
                    </Button>
                    {onTestPattern && (
                        <Button onClick={onTestPattern} disabled={!engineReady} variant="secondary" size="sm">
                            Test
                        </Button>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative min-h-0">
                <CodeMirror
                    value={code}
                    height="100%"
                    theme="dark"
                    extensions={[javascript(), transparentTheme]}
                    onChange={(val) => setCode(val)}
                    className="h-full font-mono"
                    basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: true,
                        highlightActiveLine: true,
                        foldGutter: false,
                        drawSelection: true,
                        dropCursor: true,
                        allowMultipleSelections: true,
                        indentOnInput: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: true,
                        rectangularSelection: true,
                        crosshairCursor: false,
                        highlightSelectionMatches: false,
                        syntaxHighlighting: true
                    }}
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
