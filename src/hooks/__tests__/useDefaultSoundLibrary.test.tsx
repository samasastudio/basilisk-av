import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useDefaultSoundLibrary } from '../useDefaultSoundLibrary';

import type { UseUserLibraryReturn } from '../useUserLibrary';

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

    renderHook(() => useDefaultSoundLibrary(userLibrary));

    expect(userLibrary.linkCDN).toHaveBeenCalledWith('https://cdn.example.com/samples');
  });

  it('does not link CDN when env var is not set', () => {
    const userLibrary = createUserLibrary();

    renderHook(() => useDefaultSoundLibrary(userLibrary));

    expect(userLibrary.linkCDN).not.toHaveBeenCalled();
  });

  it('does not override existing user library source', () => {
    vi.stubEnv('VITE_DEFAULT_SOUND_LIBRARY', 'https://cdn.example.com/samples');
    const userLibrary = createUserLibrary({ source: 'cdn', cdnUrl: 'https://cdn.example.com/other' });

    renderHook(() => useDefaultSoundLibrary(userLibrary));

    expect(userLibrary.linkCDN).not.toHaveBeenCalled();
  });

  it('only attempts to load once', () => {
    vi.stubEnv('VITE_DEFAULT_SOUND_LIBRARY', 'https://cdn.example.com/samples');
    const userLibrary = createUserLibrary();

    const { rerender } = renderHook(() => useDefaultSoundLibrary(userLibrary));

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

    const { result } = renderHook(() => useDefaultSoundLibrary(userLibrary));

    expect(result.current.isUsingDefault).toBe(true);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Network error');
  });
});
