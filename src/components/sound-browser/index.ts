/**
 * Sound Browser Components
 */

export { SoundBrowserTray } from './SoundBrowserTray';
export { SoundCategoryChips } from './SoundCategoryChips';
export { SoundSampleGrid } from './SoundSampleGrid';

// Re-export from shared for backward compatibility
export { SampleSearch as SoundSearch } from '../shared';

export type { SoundBrowserTrayProps } from './SoundBrowserTray';
export type { SoundCategoryChipsProps } from './SoundCategoryChips';
export type { SoundSampleGridProps } from './SoundSampleGrid';
export type { SampleSearchProps as SoundSearchProps } from '../shared';
