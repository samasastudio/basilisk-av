import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { Play } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { basiliskSyntaxTheme } from '../config/editorTheme';
import { DEFAULT_CODE, presetMap } from '../constants/hydraPresets';
import { getBridgeInstance } from '../services/audioBridge';

import type { PresetName } from '../constants/hydraPresets';

// Test mode FFT generator constants
const TEST_PHASE_INCREMENT = 0.1;
const TEST_FFT_AMPLITUDE_0 = 0.8;
const TEST_FFT_AMPLITUDE_1 = 0.6;
const TEST_FFT_AMPLITUDE_2 = 0.7;
const TEST_FFT_AMPLITUDE_3 = 0.5;
const TEST_FFT_PHASE_OFFSET_1 = 1;
const TEST_FFT_PHASE_OFFSET_2 = 2;
const TEST_FFT_PHASE_OFFSET_3 = 3;
const TEST_UPDATE_INTERVAL_MS = 50;
const TEST_DURATION_MS = 10000;

type Props = {
    className?: string;
    onExecute: (code: string) => void;
    initialCode?: string;
    onLoadPreset?: (code: string) => void;
    linkStatus?: string;
};

export const HydraRepl = ({ className, onExecute, initialCode = DEFAULT_CODE, onLoadPreset, linkStatus }: Props): React.ReactElement => {
    const [code, setCode] = useState(initialCode);
    const [preset, setPreset] = useState<PresetName>('none');

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onExecute(code);
        }
    }, [code, onExecute]);

    const loadPreset = (value: PresetName): void => {
        setPreset(value);
        const presetCode = presetMap[value];
        setCode(presetCode);
        (onLoadPreset ?? onExecute)(presetCode);
    };

    return (
        <div className={`flex flex-col bg-pm-panel ${className}`}>
            <div className="flex justify-between items-center p-2 border-b border-pm-border select-none bg-pm-panel">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500/50" />
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
                <button
                    className={`px-2 py-1 rounded border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black`}
                    onClick={() => {
                        const bridge = getBridgeInstance();
                        if (!bridge) {
                            console.error('Bridge not initialized');
                            return;
                        }

                        // Enable test mode to stop tick() from overwriting values
                        bridge.testMode = true;
                        console.warn('🧪 Generating fake FFT data for 10 seconds...');

                        // Generate oscillating fake data
                        let phase = 0;
                        const interval = setInterval(() => {
                            phase += TEST_PHASE_INCREMENT;
                            bridge.fft = [
                                Math.abs(Math.sin(phase)) * TEST_FFT_AMPLITUDE_0,
                                Math.abs(Math.sin(phase + TEST_FFT_PHASE_OFFSET_1)) * TEST_FFT_AMPLITUDE_1,
                                Math.abs(Math.sin(phase + TEST_FFT_PHASE_OFFSET_2)) * TEST_FFT_AMPLITUDE_2,
                                Math.abs(Math.sin(phase + TEST_FFT_PHASE_OFFSET_3)) * TEST_FFT_AMPLITUDE_3
                            ];
                        }, TEST_UPDATE_INTERVAL_MS);

                        // Stop after 10 seconds and resume normal operation
                        setTimeout(() => {
                            clearInterval(interval);
                            bridge.testMode = false;
                            console.warn('✅ Test mode ended, resuming normal operation');
                        }, TEST_DURATION_MS);
                    }}
                >
                    🧪 Test (Fake Audio Data)
                </button>
            </div>
            <div className="flex-1 overflow-hidden relative" onKeyDown={handleKeyDown}>
                <CodeMirror
                    value={code}
                    height="100%"
                    extensions={[javascript(), basiliskSyntaxTheme]}
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
