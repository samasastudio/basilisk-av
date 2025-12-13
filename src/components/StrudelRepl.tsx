import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import * as Strudel from '@strudel/core';
import { initHydra, H } from '@strudel/hydra';
import { samples } from '@strudel/webaudio';
import CodeMirror from '@uiw/react-codemirror';
import { Music } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

import { basiliskSyntaxTheme } from '../config/editorTheme';
import * as StrudelEngine from '../services/strudelEngine';

import { SoundBrowserTray } from './sound-browser';
import { Button } from './ui/Button';

import type { UseSoundBrowserReturn } from '../hooks/useSoundBrowser';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';

/** Configuration for CodeMirror basic setup */
const CODE_MIRROR_SETUP = {
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
} as const;

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
    fontSize: '12px',
    lineHeight: '1.5',
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

// Audio-reactive feedback loop with noise modulation
src(o0)
 .saturate(1.01)
 .scale(0.99)
 .color(1.01,1.01,1.01)
 .hue(() => a.fft[3])
 .modulateHue(src(o1).hue(.3).posterize(-1).contrast(.7),2)
  .layer(src(o1)
         .luma()
         .mult(gradient(1)
               .saturate(.9)))
  .out(o0)

noise(1, .2)
  .rotate(2,.5)
  .layer(src(o0)
  .scrollX(.2))
  .out(o1)

render(o0)

// Audio pattern
s("bd sd, hh*4")`;

type Props = {
    className?: string;
    engineReady: boolean;
    onHalt?: () => void;
    onExecute?: () => void;
    onSave?: (code: string) => void;
    statusLabel?: string;
    soundBrowser: UseSoundBrowserReturn;
};

/* eslint-disable max-lines-per-function */
export const StrudelRepl = ({ className, engineReady, onHalt, onExecute, onSave, statusLabel, soundBrowser }: Props): JSX.Element => {
    const [code, setCode] = useState(defaultCode);

    // Ref for CodeMirror editor to enable text insertion
    const editorRef = useRef<ReactCodeMirrorRef>(null);

    /**
     * Insert text at current cursor position in the editor
     */
    const insertTextAtCursor = useCallback((text: string): void => {
      const view = editorRef.current?.view;

      if (!view) {
        console.warn('Cannot insert: editor view not available');
        return;
      }

      // Get current cursor position
      const cursorPos = view.state.selection.main.head;

      // Insert text at cursor
      view.dispatch({
        changes: {
          from: cursorPos,
          insert: text
        },
        selection: {
          anchor: cursorPos + text.length  // Move cursor to end of inserted text
        }
      });

      // Focus editor after insertion
      view.focus();
    }, []);

    /**
     * Handle sample insertion from sound browser
     * Formats as Strudel pattern string: s("category:index")
     */
    const handleSampleInsert = useCallback((categoryName: string, index: number): void => {
      const patternString = `s("${categoryName}:${index}")`;
      insertTextAtCursor(patternString);
    }, [insertTextAtCursor]);

    // Keyboard navigation: Escape to stop preview
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key === 'Escape' && soundBrowser.isOpen) {
                soundBrowser.stopPreview();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [soundBrowser]);

    const runCode = async (): Promise<void> => {
        if (!engineReady) {
            console.warn('Engine not ready. Please start the engine first.');
            return;
        }

        const repl = StrudelEngine.getReplInstance();
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
        StrudelEngine.hushAudio();
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
                    <Button
                        onClick={soundBrowser.toggle}
                        disabled={!engineReady}
                        variant={soundBrowser.isOpen ? 'primary' : 'secondary'}
                        size="sm"
                        title="Sound Browser - Browse and preview Strudel samples"
                    >
                        <Music size={14} />
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative min-h-0">
                <CodeMirror
                    ref={editorRef}
                    value={code}
                    height="100%"
                    extensions={[javascript(), transparentTheme, basiliskSyntaxTheme]}
                    onChange={(val) => setCode(val)}
                    className="h-full font-mono"
                    basicSetup={CODE_MIRROR_SETUP}
                    onKeyDown={(e) => {
                        // Shift+Enter to execute code
                        if (e.shiftKey && e.key === 'Enter') {
                            e.preventDefault();
                            runCode();
                        }

                        // Ctrl+S to save script
                        // Note: Global shortcut in App.tsx prevents browser's save dialog
                        // This handler performs the actual save with access to current code
                        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                            e.preventDefault();
                            if (onSave) {
                                onSave(code);
                            }
                        }
                    }}
                />
            </div>
            {soundBrowser.isOpen && (
                <div className="flex-1 min-h-[300px] flex flex-col overflow-hidden">
                    <SoundBrowserTray
                        categories={soundBrowser.filteredCategories}
                        groups={soundBrowser.groups}
                        selectedGroup={soundBrowser.selectedGroup}
                        onSelectGroup={soundBrowser.setSelectedGroup}
                        searchQuery={soundBrowser.searchQuery}
                        onSearchChange={soundBrowser.setSearchQuery}
                        selectedCategory={soundBrowser.selectedCategory}
                        onSelectCategory={soundBrowser.setSelectedCategory}
                        currentlyPlaying={soundBrowser.currentlyPlaying}
                        onPreviewSample={soundBrowser.previewSample}
                        onStopPreview={soundBrowser.stopPreview}
                        isLoading={soundBrowser.isLoading}
                        error={soundBrowser.error}
                        canPreview={soundBrowser.canPreview}
                        onInsertSample={handleSampleInsert}
                    />
                </div>
            )}
        </div>
    );
};
/* eslint-enable max-lines-per-function */
