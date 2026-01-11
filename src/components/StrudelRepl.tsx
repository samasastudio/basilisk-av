import { javascript } from '@codemirror/lang-javascript';
import { sliderPlugin, sliderWithID, widgetPlugin } from '@strudel/codemirror';
import * as Strudel from '@strudel/core';
// @ts-expect-error - @strudel/draw has no type definitions
import * as StrudelDraw from '@strudel/draw';
import { initHydra, H } from '@strudel/hydra';
import * as StrudelWeb from '@strudel/web';
import { samples } from '@strudel/webaudio';
import CodeMirror from '@uiw/react-codemirror';
import { AudioWaveform, Music } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { basiliskSyntaxTheme, transparentEditorTheme } from '../config/editorTheme';
import { useTheme } from '../contexts/ThemeContext';
import { useWidgetUpdates } from '../hooks/useWidgetUpdates';
import * as StrudelEngine from '../services/strudelEngine';
import { basiliskDark } from '../themes/codemirrorDark';
import { registerPatternMethods } from '../utils/patternWidgetRegistration';

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

/** Retry interval in milliseconds for Pattern registration */
const PATTERN_RETRY_INTERVAL_MS = 100;
/** Maximum retry attempts for Pattern registration */
const PATTERN_MAX_RETRY_ATTEMPTS = 20;

// Expose Strudel functions globally for the REPL
// sliderWithID is required by the transpiler when slider() is used in patterns
// StrudelWeb includes all webaudio methods
// StrudelDraw includes visualization methods (punchcard, pianoroll, scope, spiral, etc.)
Object.assign(window, Strudel, StrudelWeb, StrudelDraw, { samples, initHydra, H, sliderWithID });

const defaultCode = `// Audio-reactive feedback loop with noise modulation
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
export const StrudelRepl = ({ className, engineReady, onHalt, onExecute, onSave, statusLabel, soundBrowser, userLibrary, panelState }: Props): React.ReactElement => {
    const [code, setCode] = useState(defaultCode);
    const [userLibraryPlaying, setUserLibraryPlaying] = useState<string | null>(null);
    const { theme } = useTheme();

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
    }, [soundBrowser]);

    // Register Pattern.prototype methods when component mounts
    useEffect(() => {
        // Try to register immediately
        if (!registerPatternMethods()) {
            // If Pattern not available, retry periodically
            let attempts = 0;

            const retryInterval = setInterval(() => {
                attempts++;

                if (registerPatternMethods() || attempts >= PATTERN_MAX_RETRY_ATTEMPTS) {
                    clearInterval(retryInterval);

                    if (attempts >= PATTERN_MAX_RETRY_ATTEMPTS) {
                        console.error('[StrudelRepl] Failed to register Pattern.prototype methods - window.Pattern never became available');
                    }
                }
            }, PATTERN_RETRY_INTERVAL_MS);

            return () => clearInterval(retryInterval);
        }
    }, []); // Run once on mount

    // Getter for editor view - stable callback for useWidgetUpdates
    const getEditorView = useCallback(() => editorRef.current?.view, []);

    // Subscribe to widget updates using useSyncExternalStore pattern
    useWidgetUpdates(getEditorView);

    const runCode = (): void => {
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
            repl.evaluate(code);
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

    // Theme-aware styling
    // Light = original REPL (no glassmorphism), Dark = transparent/muted glassmorphism
    const isLightTheme = theme === 'light';

    // Theme-aware CodeMirror extensions
    // Light mode: original syntax theme, Dark mode: muted colors for Hydra visibility
    const editorExtensions = useMemo(() => {
        const baseExtensions = [javascript(), transparentEditorTheme];
        const themeExtensions = isLightTheme
            ? [basiliskSyntaxTheme]
            : basiliskDark;
        // Note: sliderPlugin and widgetPlugin have type issues but work at runtime
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [...baseExtensions, ...themeExtensions, sliderPlugin as any, widgetPlugin as any];
    }, [isLightTheme]);

    // Container: light has no special styling, dark gets glassmorphism
    const containerClass = isLightTheme
        ? `flex flex-col h-full w-full ${className ?? ''}`
        : `flex flex-col h-full w-full backdrop-blur-md rounded-lg border ${className ?? ''}`;

    const containerStyle: React.CSSProperties | undefined = isLightTheme
        ? undefined
        : {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          };

    // Header: light uses original Tailwind classes, dark uses glassmorphism
    const headerClass = isLightTheme
        ? 'bg-basilisk-gray-800/50 border-b border-basilisk-gray-700'
        : 'bg-black/40 border-b border-white/10 rounded-t-lg';

    return (
        <div
            className={containerClass}
            style={containerStyle}
        >
            <div className={`drag-handle h-10 flex items-center justify-between px-3 cursor-move flex-shrink-0 ${headerClass}`}>
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
                    >
                        <Music size={14} />
                    </Button>
                    <Button
                        onClick={panelState.toggleUserLibrary}
                        variant={panelState.isUserLibraryOpen ? 'primary' : 'secondary'}
                        size="sm"
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
                    extensions={editorExtensions}
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
