/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Path or URL to default Strudel script */
  readonly VITE_DEFAULT_SCRIPT?: string;
  /** URL to default sound library (CDN-style with samples.json) */
  readonly VITE_DEFAULT_SOUND_LIBRARY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
