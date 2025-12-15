/**
 * Individual item in the directory tree (file or folder)
 */

import { ChevronRight, Folder, FolderOpen, FileAudio, Volume2 } from 'lucide-react';

import type { SampleItem } from '../../types/userLibrary';

/** Indentation per depth level in pixels */
const INDENT_PER_LEVEL = 12;
/** Base padding in pixels */
const BASE_PADDING = 8;

interface DirectoryItemProps {
  item: SampleItem;
  depth: number;
  isExpanded: boolean;
  isPlaying: boolean;
  onToggleExpand: () => void;
  onPreview: () => void;
  onInsert: () => void;
}

export const DirectoryItem = ({
  item,
  depth,
  isExpanded,
  isPlaying,
  onToggleExpand,
  onPreview,
  onInsert
}: DirectoryItemProps): JSX.Element => {
  const isDirectory = item.type === 'directory';
  const paddingLeft = `${(depth * INDENT_PER_LEVEL) + BASE_PADDING}px`;

  const handleClick = (): void => {
    if (isDirectory) {
      onToggleExpand();
    } else {
      onPreview();
    }
  };

  const handleDoubleClick = (): void => {
    if (!isDirectory) {
      onInsert();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      if (isDirectory) {
        onToggleExpand();
      } else {
        onInsert();
      }
    } else if (e.key === ' ' && !isDirectory && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      onPreview();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      style={{ paddingLeft }}
      className={`
        flex items-center gap-2 py-1.5 pr-2 cursor-pointer select-none
        text-xs transition-colors rounded-sm
        ${isPlaying
          ? 'bg-basilisk-purple-500/20 text-basilisk-purple-300'
          : 'text-basilisk-gray-300 hover:bg-basilisk-gray-700/40'
        }
      `}
    >
      {isDirectory ? (
        <>
          <ChevronRight
            size={12}
            className={`text-basilisk-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
          {isExpanded ? (
            <FolderOpen size={14} className="text-basilisk-yellow-400" />
          ) : (
            <Folder size={14} className="text-basilisk-yellow-400" />
          )}
        </>
      ) : (
        <>
          <span className="w-3" /> {/* Spacer for alignment */}
          {isPlaying ? (
            <Volume2 size={14} className="text-basilisk-purple-400" />
          ) : (
            <FileAudio size={14} className="text-basilisk-gray-500" />
          )}
        </>
      )}

      <span className="flex-1 truncate" title={item.name}>
        {item.name}
      </span>

      {item.format && !isDirectory ? (
        <span className="text-[10px] text-basilisk-gray-600 uppercase">
          {item.format}
        </span>
      ) : null}

      {isDirectory && item.children ? (
        <span className="text-[10px] text-basilisk-gray-600">
          {item.children.length}
        </span>
      ) : null}
    </div>
  );
};
