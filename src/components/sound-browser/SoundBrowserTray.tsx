/**
 * Main sound browser tray component
 */

import { getGroupByName } from '../../config/sampleGroups';
import { SamplePanel, SampleSearch } from '../shared';

import { SoundCategoryChips } from './SoundCategoryChips';
import { SoundSampleGrid } from './SoundSampleGrid';

import type { CategorizedSampleCategory } from '../../hooks/useSoundBrowser';

/**
 * Group tab button component
 */
const GroupTabButton = ({
  group,
  isSelected,
  onClick
}: {
  group: string;
  isSelected: boolean;
  onClick: () => void;
}): JSX.Element => {
  const groupInfo = getGroupByName(group);
  const IconComponent = groupInfo?.icon;

  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      className={`
        flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded text-xs font-medium
        transition-colors duration-200
        ${
          isSelected
            ? 'bg-basilisk-accent-cool text-white'
            : 'bg-basilisk-gray-700/50 text-basilisk-gray-300 hover:bg-basilisk-gray-700 hover:text-white'
        }
      `}
    >
      {IconComponent && <IconComponent size={14} className="flex-shrink-0" />}
      {group}
    </button>
  );
};

/**
 * Calculate next tab index based on keyboard input
 */
const getNextTabIndex = (key: string, currentIndex: number, totalTabs: number): number => {
  const handlers: Record<string, () => number> = {
    'ArrowLeft': () => (currentIndex > 0 ? currentIndex - 1 : totalTabs - 1),
    'ArrowRight': () => (currentIndex < totalTabs - 1 ? currentIndex + 1 : 0),
    'Home': () => 0,
    'End': () => totalTabs - 1
  };

  return handlers[key]?.() ?? currentIndex;
};

/**
 * Handle keyboard navigation for group tabs
 */
const handleGroupTabNavigation = (
  event: React.KeyboardEvent<HTMLDivElement>,
  groups: string[],
  currentGroup: string,
  onSelectGroup: (group: string) => void
): void => {
  const currentIndex = groups.indexOf(currentGroup);
  if (currentIndex === -1) return;

  const nextIndex = getNextTabIndex(event.key, currentIndex, groups.length);

  if (nextIndex !== currentIndex) {
    event.preventDefault();
    onSelectGroup(groups[nextIndex]);
  }
};

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
  /** Whether preview is available (engine ready) */
  canPreview?: boolean;
  /** Callback to insert sample into editor on double-click */
  onInsertSample?: (categoryName: string, index: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sound browser tray with groups, search, category filters, and sample grid
 *
 * Note: Complexity warning disabled due to necessary conditional rendering in JSX
 */
/* eslint-disable complexity */
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
  canPreview = true,
  onInsertSample,
  className = ''
}: SoundBrowserTrayProps): JSX.Element => {
  // Get selected category object
  const selectedCategoryObj = categories.find((cat) => cat.name === selectedCategory);

  // Determine content state
  const hasNoResults = !isLoading && !error && categories.length === 0;
  const canShowCategories = !isLoading && !error && categories.length > 0;
  const canShowSampleGrid = !isLoading && !error && selectedCategoryObj;

  return (
    <SamplePanel className={className}>
      {/* Top row: Search and Group tabs */}
      <div className="flex items-center gap-2">
        <SampleSearch
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search..."
          className="w-40 flex-shrink-0"
        />

        {/* Group tabs */}
        <div
          role="tablist"
          onKeyDown={(e) => handleGroupTabNavigation(e, groups, selectedGroup, onSelectGroup)}
          className="flex items-center gap-1 overflow-x-auto scrollbar-minimal flex-1"
        >
          {groups.map((group) => (
            <GroupTabButton
              key={group}
              group={group}
              isSelected={selectedGroup === group}
              onClick={() => onSelectGroup(group)}
            />
          ))}
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
      {canShowCategories && (
        <SoundCategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          searchQuery={searchQuery}
        />
      )}

      {/* Sample grid (shown when category is selected) */}
      {canShowSampleGrid && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-minimal py-1">
          <SoundSampleGrid
            categoryName={selectedCategoryObj.name}
            samples={selectedCategoryObj.samples}
            currentlyPlaying={currentlyPlaying}
            onPreviewSample={onPreviewSample}
            onStopPreview={onStopPreview}
            canPreview={canPreview}
            onInsertSample={onInsertSample}
          />
        </div>
      )}

      {/* No results message */}
      {hasNoResults && (
        <div className="text-sm text-basilisk-gray-500 text-center py-4">
          No categories found
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}
    </SamplePanel>
  );
};
/* eslint-enable complexity */
