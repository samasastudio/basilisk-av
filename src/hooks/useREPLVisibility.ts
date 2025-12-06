import { usePersistedState } from './usePersistedState';

const STORAGE_KEY = 'basilisk-repl-visible';

/**
 * Hook for managing REPL panel visibility with localStorage persistence.
 *
 * @returns Object with visibility state and toggle function
 */
export const useREPLVisibility = (): {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  toggleVisible: () => void;
} => {
  const [isVisible, setVisible] = usePersistedState<boolean>(STORAGE_KEY, true);

  const toggleVisible = (): void => {
    setVisible((prev) => !prev);
  };

  return { isVisible, setVisible, toggleVisible };
};
