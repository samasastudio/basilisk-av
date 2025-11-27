/**
 * Monkey-patches superdough's connectToDestination to route through our analyser.
 * This MUST be imported before @strudel/web to intercept the audio routing.
 */

import { initHydraBridge, type HydraBridge } from './strudelHydraBridge';

let bridgeInitializer: ((ctx: AudioContext) => void) | null = null;

export function setBridgeInitializer(fn: (ctx: AudioContext) => void) {
    bridgeInitializer = fn;
    console.log('🔧 Bridge initializer registered');
}

if (typeof window !== 'undefined') {
    const originalConnect = AudioNode.prototype.connect;
    let interceptedContext: AudioContext | null = null;
    let bridge: HydraBridge | null = null;

    AudioNode.prototype.connect = function(this: AudioNode, ...args: any[]) {
        const destination = args[0];

        // If connecting to an AudioContext destination
        if (destination && destination === (destination as any).context?.destination) {
            const ctx = (destination as any).context;

            // If this is the FIRST time we see an AudioContext, initialize the bridge
            if (!interceptedContext && ctx && bridgeInitializer) {
                console.log('🎯 FIRST destination connection detected - initializing bridge with SAME AudioContext');
                interceptedContext = ctx;

                // Initialize the bridge with the SAME AudioContext that Strudel is using
                bridge = initHydraBridge(ctx);
                if (bridge) {
                    console.log('✅ Bridge created with Strudel\'s AudioContext');
                    bridgeInitializer(ctx);
                } else {
                    console.error('❌ Failed to create bridge');
                }
            }

            // If we have a bridge AND this is the same context, redirect
            if (bridge && ctx === interceptedContext) {
                console.log('🔀 REDIRECTING connection to gainNode', {
                    node: this.constructor.name,
                    from: this,
                    to: bridge.gainNode
                });
                return originalConnect.call(this, bridge.gainNode);
            }
        }

        // Normal connection
        return originalConnect.apply(this, args as any);
    };

    console.log('✅ Superdough connection patcher installed');
}
