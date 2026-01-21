/**
 * State for a loadable asset (script or sound library)
 */
export interface AssetLoadState {
  /** Whether the asset is currently loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Source path/URL of the asset */
  source: string | null;
  /** Retry handler for failed loads */
  retry?: () => void;
}

/**
 * State for default script asset
 */
export interface DefaultScriptState extends AssetLoadState {
  /** Script content if loaded successfully */
  content: string | null;
}

/**
 * Combined state for all default assets (script and sound library)
 * Used to reduce prop drilling through REPLWindow → StrudelRepl
 */
export interface DefaultAssetsState {
  script: DefaultScriptState;
  library: AssetLoadState;
}
