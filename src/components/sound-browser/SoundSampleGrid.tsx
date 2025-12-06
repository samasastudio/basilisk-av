/**
 * Grid/list of samples with play buttons
 */

import { Play } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SoundSampleGridProps {
  /** Category name */
  categoryName: string;
  /** Array of sample file paths */
  samples: string[];
  /** Currently playing sample key (format: "category:index") */
  currentlyPlaying: string | null;
  /** Callback when sample is clicked */
  onPreviewSample: (categoryName: string, index: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Grid of sample buttons for preview
 *
 * Features:
 * - Displays sample filenames
 * - Play button for each sample
 * - Highlights currently playing sample
 * - Responsive grid layout
 */
export const SoundSampleGrid = ({
  categoryName,
  samples,
  currentlyPlaying,
  onPreviewSample,
  className = ''
}: SoundSampleGridProps): JSX.Element => {
  /**
   * Extract filename from path (e.g., "808/BD.WAV" -> "BD.WAV")
   */
  const getFileName = (path: string): string => {
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 ${className}`}>
      {samples.map((sample, index) => {
        const sampleKey = `${categoryName}:${index}`;
        const isPlaying = currentlyPlaying === sampleKey;
        const fileName = getFileName(sample);

        return (
          <button
            key={sampleKey}
            onClick={() => onPreviewSample(categoryName, index)}
            className={`
              flex items-center gap-2 px-2 py-1.5 rounded text-xs
              transition-colors duration-200
              ${
                isPlaying
                  ? 'bg-basilisk-accent-cool/20 border border-basilisk-accent-cool text-basilisk-accent-cool'
                  : 'bg-basilisk-gray-700/50 border border-basilisk-gray-600 text-basilisk-gray-200 hover:bg-basilisk-gray-700 hover:border-basilisk-gray-500'
              }
            `}
            title={`${categoryName}:${index} - ${fileName}`}
          >
            <Play
              size={12}
              className={`flex-shrink-0 ${isPlaying ? 'fill-current' : ''}`}
            />
            <span className="truncate text-left">{fileName}</span>
          </button>
        );
      })}
    </div>
  );
};
