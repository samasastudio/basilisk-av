/**
 * Utility functions for theme management
 */

export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'basilisk-theme';

/**
 * Get initial theme from localStorage or default to 'light'
 * Light = original solid dark REPL appearance
 * Dark = muted/transparent glassmorphism appearance
 */
export const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return 'light'; // Default to light (original solid dark REPL appearance)
};

/**
 * Save theme to localStorage and update document class
 */
export const persistTheme = (theme: Theme): void => {
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  // Update document class for CSS fallbacks
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
};
