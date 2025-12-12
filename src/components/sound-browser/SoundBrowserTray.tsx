/**
 * Main sound browser tray component
 */

import { getGroupByName } from '../../config/sampleGroups';

import { SoundCategoryChips } from './SoundCategoryChips';
import { SoundSampleGrid } from './SoundSampleGrid';
import { SoundSearch } from './SoundSearch';


import type { CategorizedSampleCategory } from '../../hooks/useSoundBrowser';

export interface SoundBrowserTrayProps {
  /** All available categories (already filtered by group/search) */
  categories: CategorizedSampleCategory[];
  /** Available groups */
  groups: string[];
  /** Currently selected group */
  selectedGroup: string;
  /** Callback when group is selected */
  onSelectGroup: (group: string) => void;
  /** Current search query */
  searchQuery: string;
  /** Callback when search changes */
  onSearchChange: (query: string) => void;
  /** Currently selected category */
  selectedCategory: string | null;
  /** Callback when category is selected */
  onSelectCategory: (category: string | null) => void;
  /** Currently playing sample */
  currentlyPlaying: string | null;
  /** Callback to preview a sample */
  onPreviewSample: (categoryName: string, index: number) => void;
  /** Callback to stop preview */
  onStopPreview: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sound browser tray with groups, search, category filters, and sample grid
 */
export const SoundBrowserTray = ({
  categories,
  groups,
  selectedGroup,
  onSelectGroup,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  currentlyPlaying,
  onPreviewSample,
  onStopPreview,
  isLoading = false,
  error = null,
  className = ''
}: SoundBrowserTrayProps): JSX.Element => {
  // Get selected category object
  const selectedCategoryObj = categories.find((cat) => cat.name === selectedCategory);

  return (
    <div
      className={`
        h-full flex flex-col gap-1 px-2 py-1.5
        bg-basilisk-gray-800/50
        border-t border-basilisk-gray-700
        animate-in fade-in slide-in-from-bottom-4 duration-200
        ${className}
      `}
    >
      {/* Top row: Search and Group tabs */}
      <div className="flex items-center gap-2">
        <SoundSearch
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search..."
          className="w-40 flex-shrink-0"
        />

        {/* Group tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-minimal flex-1">
          {groups.map((group) => {
            const isSelected = selectedGroup === group;
            const groupInfo = getGroupByName(group);
            const icon = groupInfo?.icon;

            return (
              <button
                key={group}
                onClick={() => onSelectGroup(group)}
                className={`
                  flex-shrink-0 px-2 py-1 rounded text-xs font-medium
                  transition-colors duration-200
                  ${
                    isSelected
                      ? 'bg-basilisk-accent-cool text-white'
                      : 'bg-basilisk-gray-700/50 text-basilisk-gray-300 hover:bg-basilisk-gray-700 hover:text-white'
                  }
                `}
              >
                {icon && <span className="mr-1">{icon}</span>}
                {group}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-sm text-basilisk-gray-400 text-center py-4">Loading samples...</div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-400 text-center py-4">Error: {error}</div>
      )}

      {/* Category chips */}
      {!isLoading && !error && categories.length > 0 && (
        <SoundCategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      )}

      {/* Sample grid (shown when category is selected) */}
      {!isLoading && !error && selectedCategoryObj && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-minimal py-1">
          <SoundSampleGrid
            categoryName={selectedCategoryObj.name}
            samples={selectedCategoryObj.samples}
            currentlyPlaying={currentlyPlaying}
            onPreviewSample={onPreviewSample}
            onStopPreview={onStopPreview}
          />
        </div>
      )}

      {/* No results message */}
      {!isLoading && !error && categories.length === 0 && (
        <div className="text-sm text-basilisk-gray-500 text-center py-4">
          No categories found
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}
    </div>
  );
};
