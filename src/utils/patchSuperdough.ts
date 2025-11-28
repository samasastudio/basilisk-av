/**
 * Audio Routing Patcher for Strudel → Hydra Integration
 *
 * Intercepts AudioNode connections to route Strudel's audio output through
 * an AnalyserNode, enabling Hydra visuals to react to audio via a.fft values.
 *
 * CRITICAL: Must be imported BEFORE @strudel/web to patch AudioNode.prototype.connect
 * before Strudel's AudioWorklet initializes.
 */

import { initHydraBridge, type HydraBridge } from './strudelHydraBridge';

let bridgeInitializer: ((ctx: AudioContext) => void) | null = null;

export function setBridgeInitializer(fn: (ctx: AudioContext) => void) {
    bridgeInitializer = fn;
}

if (typeof window !== 'undefined') {
    const originalConnect = AudioNode.prototype.connect;
    let interceptedContext: AudioContext | null = null;
    let bridge: HydraBridge | null = null;

    AudioNode.prototype.connect = function(this: AudioNode, ...args: any[]): any {
        const destination = args[0];

        // Detect connections to AudioContext destination
        if (destination && destination === (destination as any).context?.destination) {
            const ctx = (destination as any).context;

            // On first destination connection, initialize the audio bridge
            if (!interceptedContext && ctx && bridgeInitializer) {
                interceptedContext = ctx;
                bridge = initHydraBridge(ctx);

                if (bridge) {
                    bridgeInitializer(ctx);
                } else {
                    console.error('Failed to create Hydra audio bridge');
                }
            }

            // Redirect all audio to flow through the analyser
            if (bridge && ctx === interceptedContext) {
                // Connect to gainNode instead of destination (with proper parameters)
                // @ts-ignore - Complex overload handling for AudioNode.connect
                return originalConnect.call(this, bridge.gainNode, args[1], args[2]);
            }
        }

        // Normal connection for non-destination targets
        return originalConnect.apply(this, args as any);
    };
}
