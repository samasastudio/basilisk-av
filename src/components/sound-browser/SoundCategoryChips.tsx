/**
 * Horizontal scrollable category filter chips
 */

import { highlightMatch } from '../../utils/highlightMatch';

import type { SampleCategory } from '../../types/samples';

export interface SoundCategoryChipsProps {
  /** All available categories */
  categories: SampleCategory[];
  /** Currently selected category name (null if none) */
  selectedCategory: string | null;
  /** Callback when category is selected */
  onSelectCategory: (categoryName: string | null) => void;
  /** Search query for highlighting matches */
  searchQuery?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Horizontal chip list for category filtering
 *
 * Features:
 * - Horizontally scrollable
 * - Shows category name and sample count
 * - Highlights selected category
 * - Click to select, click again to deselect
 */
export const SoundCategoryChips = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery = '',
  className = ''
}: SoundCategoryChipsProps): JSX.Element => {
  const handleChipClick = (categoryName: string): void => {
    // Toggle: if already selected, deselect
    if (selectedCategory === categoryName) {
      onSelectCategory(null);
    } else {
      onSelectCategory(categoryName);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto scrollbar-minimal py-1 ${className}`}>
      {categories.map((category) => {
        const isSelected = selectedCategory === category.name;

        return (
          <button
            key={category.name}
            onClick={() => handleChipClick(category.name)}
            aria-pressed={isSelected}
            className={`
              flex-shrink-0 px-2 py-1 rounded text-xs font-mono
              transition-colors duration-200
              ${
                isSelected
                  ? 'bg-basilisk-accent-cool/80 text-white border border-basilisk-accent-cool'
                  : 'bg-basilisk-gray-700/50 text-basilisk-gray-300 border border-basilisk-gray-600 hover:bg-basilisk-gray-700 hover:text-white'
              }
            `}
          >
            {highlightMatch(category.name, searchQuery)}
            <span className="text-xs opacity-60 ml-1">({category.count})</span>
          </button>
        );
      })}
    </div>
  );
};
