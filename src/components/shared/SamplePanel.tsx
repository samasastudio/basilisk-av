/**
 * Shared base panel component for sample browsers
 * Provides consistent styling and structure for Sound Browser and User Library
 */

import type { ReactNode } from 'react';

export interface SamplePanelProps {
  /** Panel content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Base panel wrapper with consistent glassmorphic styling
 *
 * This is a minimal shared component that provides:
 * - Consistent background and border styling
 * - Animation on mount
 * - Flexible content area
 *
 * Content rendering (search, tree, grid, etc.) is handled by child components.
 */
export const SamplePanel = ({
  children,
  className = ''
}: SamplePanelProps): React.ReactElement => (
  <div
    className={`
      h-full flex flex-col gap-1 px-2 py-1.5
      bg-basilisk-gray-800/50
      border-t border-basilisk-gray-700
      animate-in fade-in slide-in-from-bottom-4 duration-200
      ${className}
    `}
  >
    {children}
  </div>
);
