/**
 * Input for linking samples from a CDN/URL
 */

import { Globe, Info, Link2 } from 'lucide-react';
import { useState } from 'react';

interface CDNUrlInputProps {
  onLinkCDN: (url: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  currentUrl: string | null;
}

export const CDNUrlInput = ({
  onLinkCDN,
  isLoading,
  error,
  currentUrl
}: CDNUrlInputProps): React.ReactElement => {
  const [url, setUrl] = useState(currentUrl ?? '');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    void onLinkCDN(url);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="p-4 rounded-full bg-basilisk-gray-700/50">
        <Globe size={32} className="text-basilisk-purple-400" />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-basilisk-gray-200">
          Link Samples from URL
        </h3>
        <p className="text-xs text-basilisk-gray-400 max-w-xs">
          Enter the base URL where your samples.json manifest is hosted
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <div className="relative">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-basilisk-gray-500" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/samples"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-basilisk-gray-800 border border-basilisk-gray-700 text-basilisk-gray-200 placeholder-basilisk-gray-500 focus:outline-none focus:border-basilisk-purple-500/50 focus:ring-1 focus:ring-basilisk-purple-500/30"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-basilisk-purple-500/20 text-basilisk-purple-300 border border-basilisk-purple-500/40 hover:bg-basilisk-purple-500/30 hover:border-basilisk-purple-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Load Samples'}
        </button>
      </form>

      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : null}

      <div className="flex items-start gap-2 p-3 mt-2 text-left rounded-lg bg-basilisk-gray-800/50 border border-basilisk-gray-700/50">
        <Info size={14} className="text-basilisk-gray-400 mt-0.5 flex-shrink-0" />
        <div className="text-[10px] text-basilisk-gray-500 leading-relaxed space-y-1">
          <p>Your URL should have a samples.json file with this format:</p>
          <pre className="p-1.5 rounded bg-basilisk-gray-900/50 text-basilisk-gray-400 overflow-x-auto">
{`{ "samples": ["kick.wav", "snare.wav"] }`}
          </pre>
        </div>
      </div>
    </div>
  );
};
