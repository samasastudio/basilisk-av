/**
 * Grid/list of samples with play buttons
 */

import { Play, Square } from 'lucide-react';

export interface SoundSampleGridProps {
  /** Category name */
  categoryName: string;
  /** Array of sample file paths */
  samples: string[];
  /** Currently playing sample key (format: "category:index") */
  currentlyPlaying: string | null;
  /** Callback when sample is clicked */
  onPreviewSample: (categoryName: string, index: number) => void;
  /** Callback to stop preview */
  onStopPreview?: () => void;
  /** Whether preview is available (engine ready) */
  canPreview?: boolean;
  /** Callback to insert sample into editor on double-click */
  onInsertSample?: (categoryName: string, index: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get aria-label for sample button based on state
 */
const getAriaLabel = (sampleKey: string, canPreview: boolean, isPlaying: boolean): string => {
  if (!canPreview) {
    return `${sampleKey} (preview disabled - start engine)`;
  }

  if (isPlaying) {
    return `Stop ${sampleKey}`;
  }

  return `Play ${sampleKey}`;
};

/**
 * Get title tooltip for sample button based on state
 */
const getTitleText = (sampleKey: string, canPreview: boolean, hasInsertHandler: boolean): string => {
  if (!canPreview) {
    return 'Start engine to preview samples';
  }

  if (hasInsertHandler) {
    return `Click: preview | Double-click: insert s("${sampleKey}")`;
  }

  return `Play s("${sampleKey}")`;
};

/**
 * Grid of sample buttons for preview
 *
 * Features:
 * - Displays Strudel pattern strings (e.g., "808:0")
 * - Play button for each sample
 * - Highlights currently playing sample
 * - Responsive grid layout
 */
export const SoundSampleGrid = ({
  categoryName,
  samples,
  currentlyPlaying,
  onPreviewSample,
  onStopPreview,
  canPreview = true,
  onInsertSample,
  className = ''
}: SoundSampleGridProps): JSX.Element => (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 ${className}`}>
      {samples.map((_, index) => {
        // Show Strudel pattern string format: "category:index"
        const sampleKey = `${categoryName}:${index}`;
        const isPlaying = currentlyPlaying === sampleKey;

        // Determine aria-label and title based on state
        const ariaLabel = getAriaLabel(sampleKey, canPreview, isPlaying);
        const titleText = getTitleText(sampleKey, canPreview, !!onInsertSample);

        return (
          <button
            key={sampleKey}
            onClick={() => {
              if (!canPreview) return;
              if (isPlaying && onStopPreview) {
                onStopPreview();
              } else {
                onPreviewSample(categoryName, index);
              }
            }}
            onDoubleClick={() => {
              if (onInsertSample) {
                onInsertSample(categoryName, index);
              }
            }}
            disabled={!canPreview}
            className={`
              flex items-center justify-start gap-1.5 px-2 py-1.5 rounded text-xs font-mono
              transition-colors duration-200 w-full
              ${!canPreview ? 'opacity-50 cursor-not-allowed' : ''}
              ${
                isPlaying
                  ? 'bg-basilisk-accent-cool/30 border border-basilisk-accent-cool text-basilisk-accent-cool'
                  : 'bg-basilisk-gray-700/50 border border-basilisk-gray-600 text-basilisk-gray-300 hover:bg-basilisk-gray-700 hover:border-basilisk-gray-500 hover:text-white'
              }
            `}
            title={titleText}
            aria-label={ariaLabel}
          >
            {isPlaying ? (
              <Square size={10} className="flex-shrink-0 fill-current" />
            ) : (
              <Play size={10} className="flex-shrink-0" />
            )}
            <span>{sampleKey}</span>
          </button>
        );
      })}
    </div>
  );
