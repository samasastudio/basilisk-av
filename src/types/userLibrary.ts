/**
 * Type definitions for User Sound Library
 */

/**
 * Source type for user samples
 */
export type SampleSource = 'local' | 'cdn';

/**
 * An item in the user's sample directory (file or folder)
 */
export interface SampleItem {
  /** Unique identifier (usually the relative path) */
  id: string;
  /** Display name */
  name: string;
  /** Item type */
  type: 'directory' | 'sample';
  /** Relative path from linked root */
  path: string;
  /** Children for directories */
  children?: SampleItem[];
  /** Audio format for samples */
  format?: 'wav' | 'mp3' | 'ogg' | 'flac' | 'aiff';
  /** URL for playback (blob URL for local, CDN URL for remote) */
  url?: string;
}

/**
 * Active panel state for exclusivity
 */
export type ActivePanel = 'none' | 'sound-browser' | 'user-library';

/**
 * Directory link status
 */
export type LinkStatus = 'unlinked' | 'linking' | 'linked' | 'error';

/**
 * User Library state
 */
export interface UserLibraryState {
  /** Current sample source type */
  source: SampleSource | null;
  /** Sample items tree */
  items: SampleItem[];
  /** Source name (directory name or CDN URL) */
  sourceName: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Supported audio file extensions
 */
export const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac', '.aiff', '.aif'] as const;

/**
 * Check if a filename is an audio file
 */
export const isAudioFile = (filename: string): boolean =>
  AUDIO_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));

/**
 * Get audio format from filename
 */
export const getAudioFormat = (filename: string): SampleItem['format'] | undefined => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.wav')) return 'wav';
  if (lower.endsWith('.mp3')) return 'mp3';
  if (lower.endsWith('.ogg')) return 'ogg';
  if (lower.endsWith('.flac')) return 'flac';
  if (lower.endsWith('.aiff') || lower.endsWith('.aif')) return 'aiff';
  return undefined;
};

/**
 * Get sample name from filename (without extension)
 */
export const getSampleName = (filename: string): string =>
  filename.replace(/\.[^.]+$/, '');

/**
 * Flatten a tree of sample items into a flat array of samples only
 */
export const flattenSamples = (items: SampleItem[]): SampleItem[] => {
  const result: SampleItem[] = [];

  const traverse = (itemList: SampleItem[]): void => {
    for (const item of itemList) {
      if (item.type === 'sample') {
        result.push(item);
      } else if (item.children) {
        traverse(item.children);
      }
    }
  };

  traverse(items);
  return result;
};
