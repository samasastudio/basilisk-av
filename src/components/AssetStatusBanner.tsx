import { useState } from 'react';

import { LoadError } from './LoadError';

import type { DefaultAssetsState } from '../types/defaultAssets';

interface AssetStatusBannerProps {
  /** Combined state for default assets */
  assets: DefaultAssetsState;
}

interface ErrorBannerItem {
  key: 'script' | 'library';
  title: string;
  message: string;
  source: string | null;
  onDismiss: () => void;
  onRetry: (() => void) | undefined;
}

const getLoadingMessages = (assets: DefaultAssetsState): string[] => {
  const messages: string[] = [];

  if (assets.script.isLoading) {
    const sourceText = assets.script.source ? ` from ${assets.script.source}` : '';
    messages.push(`Loading startup script${sourceText}...`);
  }

  if (assets.library.isLoading) {
    const sourceText = assets.library.source ? ` from ${assets.library.source}` : '';
    messages.push(`Loading sound library${sourceText}...`);
  }

  return messages;
};

const getErrorItems = (
  assets: DefaultAssetsState,
  dismissedScriptError: string | null,
  dismissedLibraryError: string | null,
  onDismissScriptError: (error: string) => void,
  onDismissLibraryError: (error: string) => void
): ErrorBannerItem[] => {
  const items: ErrorBannerItem[] = [];

  const scriptError = assets.script.error;
  if (scriptError !== null && scriptError !== dismissedScriptError) {
    items.push({
      key: 'script',
      title: 'Script load failed',
      message: scriptError,
      source: assets.script.source,
      onDismiss: () => onDismissScriptError(scriptError),
      onRetry: assets.script.retry,
    });
  }

  const libraryError = assets.library.error;
  if (libraryError !== null && libraryError !== dismissedLibraryError) {
    items.push({
      key: 'library',
      title: 'Sound library load failed',
      message: libraryError,
      source: assets.library.source,
      onDismiss: () => onDismissLibraryError(libraryError),
      onRetry: assets.library.retry,
    });
  }

  return items;
};

/**
 * Status banner showing loading/error states for default assets.
 * Displays loading indicators and dismissible error messages for
 * startup script and sound library auto-loading.
 */
export const AssetStatusBanner = ({ assets }: AssetStatusBannerProps): React.ReactElement | null => {
  const [dismissedScriptError, setDismissedScriptError] = useState<string | null>(null);
  const [dismissedLibraryError, setDismissedLibraryError] = useState<string | null>(null);

  const loadingMessages = getLoadingMessages(assets);
  const errorItems = getErrorItems(
    assets,
    dismissedScriptError,
    dismissedLibraryError,
    setDismissedScriptError,
    setDismissedLibraryError
  );

  if (loadingMessages.length === 0 && errorItems.length === 0) {
    return null;
  }

  return (
    <div className="px-3 py-2 flex flex-col gap-2 border-b border-white/10 bg-black/30 text-xs">
      {loadingMessages.map(message => (
        <p key={message} className="text-basilisk-gray-300">
          {message}
        </p>
      ))}
      {errorItems.map(item => (
        <LoadError
          key={item.key}
          title={item.title}
          message={item.message}
          source={item.source ?? undefined}
          onDismiss={item.onDismiss}
          onRetry={item.onRetry}
        />
      ))}
    </div>
  );
};
