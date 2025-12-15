/**
 * Prompt for linking a local directory via File System Access API
 */

import { FolderOpen, Info } from 'lucide-react';

interface LinkDirectoryPromptProps {
  onLinkDirectory: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const LinkDirectoryPrompt = ({
  onLinkDirectory,
  isLoading,
  error
}: LinkDirectoryPromptProps): JSX.Element => (
  <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
    <div className="p-4 rounded-full bg-basilisk-gray-700/50">
      <FolderOpen size={32} className="text-basilisk-purple-400" />
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-medium text-basilisk-gray-200">
        Link a Sample Folder
      </h3>
      <p className="text-xs text-basilisk-gray-400 max-w-xs">
        Select a folder containing your audio samples (.wav, .mp3, .ogg, .flac, .aiff)
      </p>
    </div>

    <button
      type="button"
      onClick={() => { void onLinkDirectory(); }}
      disabled={isLoading}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-basilisk-purple-500/20 text-basilisk-purple-300 border border-basilisk-purple-500/40 hover:bg-basilisk-purple-500/30 hover:border-basilisk-purple-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Scanning...' : 'Choose Folder'}
    </button>

    {error ? (
      <p className="text-xs text-red-400">{error}</p>
    ) : null}

    <div className="flex items-start gap-2 p-3 mt-2 text-left rounded-lg bg-basilisk-gray-800/50 border border-basilisk-gray-700/50">
      <Info size={14} className="text-basilisk-gray-400 mt-0.5 flex-shrink-0" />
      <p className="text-[10px] text-basilisk-gray-500 leading-relaxed">
        Samples are loaded for this session only. You&apos;ll need to re-link after refreshing the page.
        Use s(&quot;filename&quot;) to play your samples.
      </p>
    </div>
  </div>
);
