import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'basilisk-theme';

/**
 * Get initial theme from localStorage or default to 'dark'
 */
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return 'dark'; // Default to dark per basilisk-style aesthetic
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps): React.ReactElement => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Persist theme to localStorage and update document class
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Update document class for CSS fallbacks
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme state and toggle function
 * @throws Error if used outside ThemeProvider
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
