/**
 * Recursive directory tree for displaying sample hierarchy
 */

import { DirectoryItem } from './DirectoryItem';

import type { SampleItem } from '../../types/userLibrary';

interface DirectoryTreeProps {
  items: SampleItem[];
  expandedPaths: Set<string>;
  currentlyPlaying: string | null;
  depth?: number;
  onToggleExpand: (path: string) => void;
  onPreview: (item: SampleItem) => void;
  onInsert: (item: SampleItem) => void;
}

export const DirectoryTree = ({
  items,
  expandedPaths,
  currentlyPlaying,
  depth = 0,
  onToggleExpand,
  onPreview,
  onInsert
}: DirectoryTreeProps): JSX.Element => (
  <>
    {items.map((item) => (
      <div key={item.id}>
        <DirectoryItem
          item={item}
          depth={depth}
          isExpanded={expandedPaths.has(item.path)}
          isPlaying={currentlyPlaying === item.id}
          onToggleExpand={() => onToggleExpand(item.path)}
          onPreview={() => onPreview(item)}
          onInsert={() => onInsert(item)}
        />

        {item.type === 'directory' && item.children && expandedPaths.has(item.path) ? (
          <DirectoryTree
            items={item.children}
            expandedPaths={expandedPaths}
            currentlyPlaying={currentlyPlaying}
            depth={depth + 1}
            onToggleExpand={onToggleExpand}
            onPreview={onPreview}
            onInsert={onInsert}
          />
        ) : null}
      </div>
    ))}
  </>
);
