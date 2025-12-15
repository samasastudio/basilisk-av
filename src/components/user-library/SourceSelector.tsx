/**
 * Tab selector for switching between Local and CDN sample sources
 */

import { FolderOpen, Globe } from 'lucide-react';

import type { SampleSource } from '../../types/userLibrary';

interface SourceSelectorProps {
  source: SampleSource | null;
  onSelectSource: (source: SampleSource) => void;
  isFileSystemSupported: boolean;
}

const getLocalButtonClass = (
  source: SampleSource | null,
  isSupported: boolean,
  activeClass: string,
  inactiveClass: string,
  disabledClass: string
): string => {
  if (source === 'local') return activeClass;
  if (isSupported) return inactiveClass;
  return disabledClass;
};

export const SourceSelector = ({
  source,
  onSelectSource,
  isFileSystemSupported
}: SourceSelectorProps): JSX.Element => {
  const baseButtonClass = 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors';
  const activeClass = 'bg-basilisk-purple-500/30 text-basilisk-purple-300 border border-basilisk-purple-500/50';
  const inactiveClass = 'text-basilisk-gray-400 hover:text-basilisk-gray-200 hover:bg-basilisk-gray-700/50';
  const disabledClass = 'text-basilisk-gray-600 cursor-not-allowed';

  const localButtonClass = getLocalButtonClass(source, isFileSystemSupported, activeClass, inactiveClass, disabledClass);

  return (
    <div className="flex gap-1 p-1 bg-basilisk-gray-800/50 rounded-lg">
      <button
        type="button"
        onClick={() => onSelectSource('local')}
        disabled={!isFileSystemSupported}
        className={`${baseButtonClass} ${localButtonClass}`}
        title={
          isFileSystemSupported
            ? 'Use local files from your computer'
            : 'File System Access not supported in this browser'
        }
      >
        <FolderOpen size={14} />
        Local
      </button>

      <button
        type="button"
        onClick={() => onSelectSource('cdn')}
        className={`${baseButtonClass} ${source === 'cdn' ? activeClass : inactiveClass}`}
        title="Load samples from a URL"
      >
        <Globe size={14} />
        URL
      </button>
    </div>
  );
};
