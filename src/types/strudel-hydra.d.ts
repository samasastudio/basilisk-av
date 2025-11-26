declare module '@strudel/hydra' {
    export function initHydra(options?: {
        feedStrudel?: number;
        detectAudio?: boolean;
    }): Promise<void>;
}
