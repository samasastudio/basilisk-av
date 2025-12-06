/**
 * Main sound browser tray component
 */

import { SoundSearch } from './SoundSearch';
import { SoundCategoryChips } from './SoundCategoryChips';
import { SoundSampleGrid } from './SoundSampleGrid';
import type { SampleCategory } from '../../types/samples';

export interface SoundBrowserTrayProps {
  /** All available categories */
  categories: SampleCategory[];
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
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sound browser tray with search, category filters, and sample grid
 */
export const SoundBrowserTray = ({
  categories,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  currentlyPlaying,
  onPreviewSample,
  isLoading = false,
  error = null,
  className = ''
}: SoundBrowserTrayProps): JSX.Element => {
  // Filter categories by search query
  const filteredCategories = searchQuery
    ? categories.filter((cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : categories;

  // Get selected category object
  const selectedCategoryObj = filteredCategories.find((cat) => cat.name === selectedCategory);

  return (
    <div
      className={`
        flex flex-col gap-3 p-3
        bg-basilisk-gray-800/50
        border-t border-basilisk-gray-700
        ${className}
      `}
    >
      {/* Search */}
      <SoundSearch value={searchQuery} onChange={onSearchChange} />

      {/* Loading state */}
      {isLoading && (
        <div className="text-sm text-basilisk-gray-400 text-center py-4">Loading samples...</div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-400 text-center py-4">Error: {error}</div>
      )}

      {/* Category chips */}
      {!isLoading && !error && filteredCategories.length > 0 && (
        <SoundCategoryChips
          categories={filteredCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      )}

      {/* Sample grid (shown when category is selected) */}
      {!isLoading && !error && selectedCategoryObj && (
        <div className="max-h-40 overflow-y-auto scrollbar-minimal">
          <SoundSampleGrid
            categoryName={selectedCategoryObj.name}
            samples={selectedCategoryObj.samples}
            currentlyPlaying={currentlyPlaying}
            onPreviewSample={onPreviewSample}
          />
        </div>
      )}

      {/* No results message */}
      {!isLoading && !error && filteredCategories.length === 0 && (
        <div className="text-sm text-basilisk-gray-500 text-center py-4">
          No categories found matching "{searchQuery}"
        </div>
      )}

      {/* Stats footer */}
      {!isLoading && !error && filteredCategories.length > 0 && (
        <div className="text-xs text-basilisk-gray-500 text-center">
          {filteredCategories.length} categories
          {selectedCategoryObj && ` · ${selectedCategoryObj.count} samples in ${selectedCategoryObj.name}`}
        </div>
      )}
    </div>
  );
};
