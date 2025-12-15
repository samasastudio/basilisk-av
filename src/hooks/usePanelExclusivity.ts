/**
 * Hook for managing panel exclusivity
 * Ensures only one panel (Sound Browser or User Library) is open at a time
 */

import { useCallback } from 'react';

import { usePersistedState } from './usePersistedState';

import type { ActivePanel } from '../types/userLibrary';

export interface UsePanelExclusivityReturn {
  /** Currently active panel */
  activePanel: ActivePanel;
  /** Open the Sound Browser panel (closes User Library if open) */
  openSoundBrowser: () => void;
  /** Open the User Library panel (closes Sound Browser if open) */
  openUserLibrary: () => void;
  /** Close whichever panel is currently open */
  closePanel: () => void;
  /** Toggle Sound Browser (open if closed, close if open) */
  toggleSoundBrowser: () => void;
  /** Toggle User Library (open if closed, close if open) */
  toggleUserLibrary: () => void;
  /** Whether Sound Browser is currently open */
  isSoundBrowserOpen: boolean;
  /** Whether User Library is currently open */
  isUserLibraryOpen: boolean;
}

const STORAGE_KEY = 'basilisk-active-panel';

/**
 * Hook for managing mutually exclusive panel states
 *
 * This hook ensures that only one panel can be open at a time:
 * - Opening Sound Browser closes User Library
 * - Opening User Library closes Sound Browser
 * - Panel state persists across sessions via localStorage
 */
export const usePanelExclusivity = (): UsePanelExclusivityReturn => {
  const [activePanel, setActivePanel] = usePersistedState<ActivePanel>(STORAGE_KEY, 'none');

  const openSoundBrowser = useCallback(() => {
    setActivePanel('sound-browser');
  }, [setActivePanel]);

  const openUserLibrary = useCallback(() => {
    setActivePanel('user-library');
  }, [setActivePanel]);

  const closePanel = useCallback(() => {
    setActivePanel('none');
  }, [setActivePanel]);

  const toggleSoundBrowser = useCallback(() => {
    setActivePanel((prev) => (prev === 'sound-browser' ? 'none' : 'sound-browser'));
  }, [setActivePanel]);

  const toggleUserLibrary = useCallback(() => {
    setActivePanel((prev) => (prev === 'user-library' ? 'none' : 'user-library'));
  }, [setActivePanel]);

  return {
    activePanel,
    openSoundBrowser,
    openUserLibrary,
    closePanel,
    toggleSoundBrowser,
    toggleUserLibrary,
    isSoundBrowserOpen: activePanel === 'sound-browser',
    isUserLibraryOpen: activePanel === 'user-library'
  };
};
