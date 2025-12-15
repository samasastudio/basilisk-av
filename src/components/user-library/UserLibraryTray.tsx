/**
 * Main User Library panel container
 * Displays sample browser with source selection and directory tree
 */

import { X, ChevronDown, ChevronUp, Unlink, CheckCircle2 } from 'lucide-react';

import { SamplePanel, SampleSearch } from '../shared';

import { CDNUrlInput } from './CDNUrlInput';
import { DirectoryTree } from './DirectoryTree';
import { LinkDirectoryPrompt } from './LinkDirectoryPrompt';
import { SourceSelector } from './SourceSelector';

import type { UseUserLibraryReturn } from '../../hooks/useUserLibrary';
import type { SampleItem } from '../../types/userLibrary';

/** Safely extract hostname from URL, returns null if invalid */
const getHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

const iconBtnClass = 'p-1 text-basilisk-gray-400 hover:text-basilisk-gray-200 transition-colors';

/** Header action buttons when source is linked */
const SourceActions = ({ library }: { library: UseUserLibraryReturn }): JSX.Element => (
  <>
    <button type="button" onClick={library.expandAll} className={iconBtnClass} title="Expand all">
      <ChevronDown size={14} />
    </button>
    <button type="button" onClick={library.collapseAll} className={iconBtnClass} title="Collapse all">
      <ChevronUp size={14} />
    </button>
    <button type="button" onClick={library.unlinkSource}
      className="p-1 text-basilisk-gray-400 hover:text-red-400 transition-colors" title="Unlink source">
      <Unlink size={14} />
    </button>
  </>
);

/** Renders content based on current state */
const LibraryContent = ({ library, hasSource, currentlyPlaying, onPreview, onInsert }: {
  library: UseUserLibraryReturn; hasSource: boolean; currentlyPlaying: string | null;
  onPreview: (item: SampleItem) => void; onInsert: (item: SampleItem) => void;
}): JSX.Element => {
  if (library.source === 'local' && !hasSource) {
    return <LinkDirectoryPrompt onLinkDirectory={library.linkLocalDirectory} isLoading={library.isLoading} error={library.error} />;
  }
  if (library.source === 'cdn' && !hasSource) {
    return <CDNUrlInput onLinkCDN={library.linkCDN} isLoading={library.isLoading} error={library.error} currentUrl={library.cdnUrl} />;
  }
  if (library.source === null) {
    return <div className="flex flex-col items-center justify-center h-full text-center p-6"><p className="text-xs text-basilisk-gray-400">Select a source type above to load your samples</p></div>;
  }
  if (hasSource && library.filteredItems.length > 0) {
    return <DirectoryTree items={library.filteredItems} expandedPaths={library.expandedPaths} currentlyPlaying={currentlyPlaying} onToggleExpand={library.toggleExpanded} onPreview={onPreview} onInsert={onInsert} />;
  }
  return <div className="flex items-center justify-center h-full text-center p-6"><p className="text-xs text-basilisk-gray-500">No samples match &quot;{library.searchQuery}&quot;</p></div>;
};

interface UserLibraryTrayProps {
  library: UseUserLibraryReturn;
  currentlyPlaying: string | null;
  onPreview: (item: SampleItem) => void;
  onInsert: (item: SampleItem) => void;
}

export const UserLibraryTray = ({ library, currentlyPlaying, onPreview, onInsert }: UserLibraryTrayProps): JSX.Element | null => {
  if (!library.isOpen) return null;

  const hasSource = library.source !== null && library.items.length > 0;

  return (
    <SamplePanel>
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-basilisk-gray-700/50">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-medium text-basilisk-gray-300">User Library</h2>
          {library.isRegistered ? <span className="flex items-center gap-1 text-[10px] text-green-400"><CheckCircle2 size={10} />{library.registeredCount} samples</span> : null}
        </div>
        <div className="flex items-center gap-1">
          {hasSource ? <SourceActions library={library} /> : null}
          <button type="button" onClick={library.close} className={iconBtnClass} title="Close panel"><X size={14} /></button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 py-1">
        <SourceSelector source={library.source} onSelectSource={library.setSource} isFileSystemSupported={library.isFileSystemSupported} />
        {hasSource && library.sourceName ? <span className="text-[10px] text-basilisk-gray-500 truncate max-w-[150px]" title={library.sourceName}>{library.source === 'local' ? library.sourceName : (getHostname(library.sourceName) ?? library.sourceName)}</span> : null}
      </div>

      {hasSource ? <SampleSearch value={library.searchQuery} onChange={library.setSearchQuery} placeholder="Search samples..." /> : null}

      <div className="flex-1 overflow-y-auto min-h-0">
        <LibraryContent library={library} hasSource={hasSource} currentlyPlaying={currentlyPlaying} onPreview={onPreview} onInsert={onInsert} />
      </div>
    </SamplePanel>
  );
};
