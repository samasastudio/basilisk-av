/**
 * Shared search input for filtering samples
 * Used by both Sound Browser and User Library
 */

import { X } from 'lucide-react';

export interface SampleSearchProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Search input component for filtering samples
 *
 * Features:
 * - Real-time filtering as user types
 * - Clear button when value is present
 * - Glassmorphic styling consistent with app theme
 */
export const SampleSearch = ({
  value,
  onChange,
  placeholder = 'Search samples...',
  className = ''
}: SampleSearchProps): React.ReactElement => (
  <div className={`relative ${className}`}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 pr-8 text-sm
        bg-basilisk-gray-800 border border-basilisk-gray-700
        rounded text-basilisk-gray-100
        placeholder-basilisk-gray-500
        focus:outline-none focus:border-basilisk-accent-cool
        transition-colors"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-2 top-1/2 -translate-y-1/2
          text-basilisk-gray-500 hover:text-basilisk-gray-300
          transition-colors"
        aria-label="Clear search"
      >
        <X size={16} />
      </button>
    )}
  </div>
);
