import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useDefaultScript } from '../useDefaultScript';

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

describe('useDefaultScript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns null content when no env var is set', () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useDefaultScript(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.content).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches script content when env var is set', async () => {
    vi.stubEnv('VITE_DEFAULT_SCRIPT', '/scripts/startup.js');
    const queryClient = createTestQueryClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '// hello world',
    });

    const { result } = renderHook(() => useDefaultScript(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.content).toBe('// hello world');
    });

    expect(result.current.error).toBeNull();
  });

  it('returns error when fetch fails', async () => {
    vi.stubEnv('VITE_DEFAULT_SCRIPT', '/scripts/missing.js');
    const queryClient = createTestQueryClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() => useDefaultScript(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.error).toContain('404');
    });

    expect(result.current.content).toBeNull();
  });
});
