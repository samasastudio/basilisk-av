import { javascript } from '@codemirror/lang-javascript';
import { sliderPlugin, sliderWithID, widgetPlugin, registerWidget, setWidget } from '@strudel/codemirror';
import { Pattern } from '@strudel/core';
import * as Strudel from '@strudel/core';
import * as StrudelDraw from '@strudel/draw';
import { initHydra, H } from '@strudel/hydra';
import * as StrudelWeb from '@strudel/web';
import { samples } from '@strudel/webaudio';
import CodeMirror from '@uiw/react-codemirror';
import { AudioWaveform, Music } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

import { basiliskSyntaxTheme, transparentEditorTheme } from '../config/editorTheme';
import { useWidgetUpdates } from '../hooks/useWidgetUpdates';
import * as StrudelEngine from '../services/strudelEngine';

import { SoundBrowserTray } from './sound-browser';
import { Button } from './ui/Button';
import { UserLibraryTray } from './user-library';

import type { UsePanelExclusivityReturn } from '../hooks/usePanelExclusivity';
import type { UseSoundBrowserReturn } from '../hooks/useSoundBrowser';
import type { UseUserLibraryReturn } from '../hooks/useUserLibrary';
import type { SampleItem } from '../types/userLibrary';
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
// sliderWithID is required by the transpiler when slider() is used in patterns
// StrudelWeb includes all webaudio methods
// StrudelDraw includes visualization methods (punchcard, pianoroll, scope, spiral, etc.)
Object.assign(window, Strudel, StrudelWeb, StrudelDraw, { samples, initHydra, H, sliderWithID });

// Helper to create and register canvas widgets
function getCanvasWidget(id: string, options: any = {}) {
    const { width = 500, height = 60, pixelRatio = window.devicePixelRatio } = options;
    let canvas = document.getElementById(id) as HTMLCanvasElement || document.createElement('canvas');
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    setWidget(id, canvas);  // Register canvas with CodeMirror's widget system
    return canvas;
}

// Note: Widget type registration with transpiler happens in strudelEngine.ts before REPL initialization
// Here we manually add the inline widget methods directly to window.Pattern.prototype
// This is needed because @strudel/codemirror's registerWidget uses its own Pattern instance
console.log('Registering inline widget methods on window.Pattern.prototype');
const WindowPattern = (window as any).Pattern;
if (WindowPattern) {
    // Directly assign methods to window.Pattern.prototype
    WindowPattern.prototype._scope = function(this: any, id?: string, options: any = {}) {
        id = id || 'scope';
        options = { width: 500, height: 60, pos: 0.5, scale: 1, ...options };
        const ctx = getCanvasWidget(id, options).getContext('2d');
        return this.tag(id).scope({ ...options, ctx, id });
    };

    WindowPattern.prototype._pianoroll = function(this: any, id?: string, options: any = {}) {
        id = id || 'pianoroll';
        const ctx = getCanvasWidget(id, options).getContext('2d');
        return this.tag(id).pianoroll({ fold: 1, ...options, ctx, id });
    };

    WindowPattern.prototype._punchcard = function(this: any, id?: string, options: any = {}) {
        id = id || 'punchcard';
        const ctx = getCanvasWidget(id, options).getContext('2d');
        return this.tag(id).punchcard({ fold: 1, ...options, ctx, id });
    };

    WindowPattern.prototype._spiral = function(this: any, id?: string, options: any = {}) {
        id = id || 'spiral';
        let _size = options.size || 275;
        options = { width: _size, height: _size, ...options, size: _size / 5 };
        const ctx = getCanvasWidget(id, options).getContext('2d');
        return this.tag(id).spiral({ ...options, ctx, id });
    };
    console.log('Inline widget methods registered successfully');
} else {
    console.error('window.Pattern not found - cannot register widget methods');
}

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
    userLibrary: UseUserLibraryReturn;
    panelState: UsePanelExclusivityReturn;
};

/* eslint-disable max-lines-per-function */
export const StrudelRepl = ({ className, engineReady, onHalt, onExecute, onSave, statusLabel, soundBrowser, userLibrary, panelState }: Props): JSX.Element => {
    const [code, setCode] = useState(defaultCode);
    const [userLibraryPlaying, setUserLibraryPlaying] = useState<string | null>(null);

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

    /**
     * Handle user library sample preview
     * Uses Web Audio API directly for independent playback.
     * For local samples, blob URLs are created lazily on-demand.
     */
    const handleUserLibraryPreview = useCallback((item: SampleItem): void => {
      if (item.type !== 'sample') return;

      // Stop any currently playing preview
      setUserLibraryPlaying(item.id);

      // Get sample URL (async for local files, sync for CDN)
      void (async (): Promise<void> => {
        const url = await userLibrary.getSampleUrl(item);
        if (!url) {
          setUserLibraryPlaying(null);
          return;
        }

        // Simple Web Audio playback
        const audio = new Audio(url);
        audio.volume = 0.7;
        audio.onended = (): void => setUserLibraryPlaying(null);
        audio.onerror = (): void => setUserLibraryPlaying(null);
        void audio.play();
      })();
    }, [userLibrary]);

    /**
     * Handle user library sample insertion
     * Inserts s("sampleName") pattern at cursor
     */
    const handleUserLibraryInsert = useCallback((item: SampleItem): void => {
      if (item.type !== 'sample') return;

      // Use filename without extension
      const sampleName = item.name.replace(/\.[^.]+$/, '');
      const patternString = `s("${sampleName}")`;
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
    }, [soundBrowser.isOpen, soundBrowser.stopPreview]);

    // Getter for editor view - stable callback for useWidgetUpdates
    const getEditorView = useCallback(() => editorRef.current?.view, []);

    // Subscribe to widget updates using useSyncExternalStore pattern
    useWidgetUpdates(getEditorView);

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
                    <Button
                        onClick={panelState.toggleUserLibrary}
                        variant={panelState.isUserLibraryOpen ? 'primary' : 'secondary'}
                        size="sm"
                        title="User Library - Browse and use your own samples"
                    >
                        <AudioWaveform size={14} />
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative min-h-0">
                <CodeMirror
                    ref={editorRef}
                    value={code}
                    height="100%"
                    extensions={[javascript(), transparentEditorTheme, basiliskSyntaxTheme, sliderPlugin, widgetPlugin]}
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
            {userLibrary.isOpen && (
                <div className="flex-1 min-h-[300px] flex flex-col overflow-hidden">
                    <UserLibraryTray
                        library={userLibrary}
                        currentlyPlaying={userLibraryPlaying}
                        onPreview={handleUserLibraryPreview}
                        onInsert={handleUserLibraryInsert}
                    />
                </div>
            )}
        </div>
    );
};
/* eslint-enable max-lines-per-function */
