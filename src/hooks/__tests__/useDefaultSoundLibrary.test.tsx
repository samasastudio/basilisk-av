import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useDefaultSoundLibrary } from '../useDefaultSoundLibrary';

import type { UseUserLibraryReturn } from '../useUserLibrary';
import type { ReactNode } from 'react';

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }): React.ReactElement => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const createUserLibrary = (overrides: Partial<UseUserLibraryReturn> = {}): UseUserLibraryReturn => ({
  isOpen: false,
  open: vi.fn(),
  close: vi.fn(),
  toggle: vi.fn(),
  source: null,
  setSource: vi.fn(),
  sourceName: null,
  items: [],
  flatItems: [],
  isLoading: false,
  error: null,
  isFileSystemSupported: true,
  linkLocalDirectory: vi.fn(),
  cdnUrl: null,
  linkCDN: vi.fn().mockResolvedValue(true),
  unlinkSource: vi.fn(),
  expandedPaths: new Set<string>(),
  toggleExpanded: vi.fn(),
  expandAll: vi.fn(),
  collapseAll: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
  filteredItems: [],
  isRegistered: false,
  registeredCount: 0,
  getSampleUrl: vi.fn(),
  ...overrides,
});

describe('useDefaultSoundLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('links CDN when env var is set and no source is selected', () => {
    vi.stubEnv('VITE_DEFAULT_SOUND_LIBRARY', 'https://cdn.example.com/samples/');
    const userLibrary = createUserLibrary();
    const queryClient = createTestQueryClient();

    renderHook(() => useDefaultSoundLibrary(userLibrary), {
      wrapper: createWrapper(queryClient),
    });

    expect(userLibrary.linkCDN).toHaveBeenCalledWith('https://cdn.example.com/samples');
  });

  it('does not link CDN when env var is not set', () => {
    const userLibrary = createUserLibrary();
    const queryClient = createTestQueryClient();

    renderHook(() => useDefaultSoundLibrary(userLibrary), {
      wrapper: createWrapper(queryClient),
    });

    expect(userLibrary.linkCDN).not.toHaveBeenCalled();
  });

  it('does not override existing user library source', () => {
    vi.stubEnv('VITE_DEFAULT_SOUND_LIBRARY', 'https://cdn.example.com/samples');
    const userLibrary = createUserLibrary({ source: 'cdn', cdnUrl: 'https://cdn.example.com/other' });
    const queryClient = createTestQueryClient();

    renderHook(() => useDefaultSoundLibrary(userLibrary), {
      wrapper: createWrapper(queryClient),
    });

    expect(userLibrary.linkCDN).not.toHaveBeenCalled();
  });

  it('only attempts to load once', () => {
    vi.stubEnv('VITE_DEFAULT_SOUND_LIBRARY', 'https://cdn.example.com/samples');
    const userLibrary = createUserLibrary();
    const queryClient = createTestQueryClient();

    const { rerender } = renderHook(() => useDefaultSoundLibrary(userLibrary), {
      wrapper: createWrapper(queryClient),
    });

    rerender();

    expect(userLibrary.linkCDN).toHaveBeenCalledTimes(1);
  });

  it('exposes loading and error state when using default library', () => {
    vi.stubEnv('VITE_DEFAULT_SOUND_LIBRARY', 'https://cdn.example.com/samples');
    const userLibrary = createUserLibrary({
      source: 'cdn',
      cdnUrl: 'https://cdn.example.com/samples',
      isLoading: true,
      error: 'Network error',
    });
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useDefaultSoundLibrary(userLibrary), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isUsingDefault).toBe(true);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Network error');
  });
});
