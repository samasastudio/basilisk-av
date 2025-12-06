/**
 * Horizontal scrollable category filter chips
 */

import type { SampleCategory } from '../../types/samples';

export interface SoundCategoryChipsProps {
  /** All available categories */
  categories: SampleCategory[];
  /** Currently selected category name (null if none) */
  selectedCategory: string | null;
  /** Callback when category is selected */
  onSelectCategory: (categoryName: string | null) => void;
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
    <div className={`flex items-center gap-2 overflow-x-auto scrollbar-minimal ${className}`}>
      {categories.map((category) => {
        const isSelected = selectedCategory === category.name;

        return (
          <button
            key={category.name}
            onClick={() => handleChipClick(category.name)}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium
              transition-colors duration-200
              ${
                isSelected
                  ? 'bg-basilisk-accent-cool text-white'
                  : 'bg-basilisk-gray-700 text-basilisk-gray-200 hover:bg-basilisk-gray-600'
              }
            `}
          >
            {category.name} <span className="text-xs opacity-70">({category.count})</span>
          </button>
        );
      })}
    </div>
  );
};
