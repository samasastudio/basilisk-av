import { useState } from 'react';

import { LoadError } from './LoadError';

import type { DefaultAssetsState } from '../types/defaultAssets';

interface AssetStatusBannerProps {
  /** Combined state for default assets */
  assets: DefaultAssetsState;
}

/**
 * Status banner showing loading/error states for default assets.
 * Displays loading indicators and dismissible error messages for
 * startup script and sound library auto-loading.
 */
export const AssetStatusBanner = ({ assets }: AssetStatusBannerProps): React.ReactElement | null => {
  const [dismissedScriptError, setDismissedScriptError] = useState<string | null>(null);
  const [dismissedLibraryError, setDismissedLibraryError] = useState<string | null>(null);

  const { script, library } = assets;

  const showScriptError = script.error !== null && script.error !== dismissedScriptError;
  const showLibraryError = library.error !== null && library.error !== dismissedLibraryError;

  const shouldShow = script.isLoading || library.isLoading || showScriptError || showLibraryError;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="px-3 py-2 flex flex-col gap-2 border-b border-white/10 bg-black/30 text-xs">
      {script.isLoading && (
        <p className="text-basilisk-gray-300">
          Loading startup script{script.source ? ` from ${script.source}` : ''}...
        </p>
      )}
      {library.isLoading && (
        <p className="text-basilisk-gray-300">
          Loading sound library{library.source ? ` from ${library.source}` : ''}...
        </p>
      )}
      {showScriptError && script.error && (
        <LoadError
          title="Script load failed"
          message={script.error}
          source={script.source ?? undefined}
          onDismiss={() => setDismissedScriptError(script.error)}
          onRetry={script.retry}
        />
      )}
      {showLibraryError && library.error && (
        <LoadError
          title="Sound library load failed"
          message={library.error}
          source={library.source ?? undefined}
          onDismiss={() => setDismissedLibraryError(library.error)}
          onRetry={library.retry}
        />
      )}
    </div>
  );
};
