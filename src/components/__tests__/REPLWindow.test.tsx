import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { REPLWindow } from '../REPLWindow';

import type { ReactElement } from 'react';

// Helper to create a fresh QueryClient for each test
const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

// Wrapper component that provides QueryClient context
const renderWithQueryClient = (ui: ReactElement, queryClient: QueryClient = createTestQueryClient()): ReturnType<typeof render> =>
  render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );

// Mock the Rnd component
vi.mock('react-rnd', () => ({
  Rnd: ({ children, className, bounds, dragHandleClassName }: React.PropsWithChildren<{
    className?: string;
    bounds?: string;
    dragHandleClassName?: string;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    onDragStop?: unknown;
    onResizeStop?: unknown;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: string;
    maxHeight?: string;
    style?: React.CSSProperties;
  }>) => (
    <div
      data-testid="rnd-wrapper"
      className={className}
      data-bounds={bounds}
      data-drag-handle-class-name={dragHandleClassName}
    >
      {children}
    </div>
  )
}));

// Mock the useREPLWindow hook
vi.mock('../../hooks/useREPLWindow', () => ({
  useREPLWindow: () => ({
    position: { x: 100, y: 100 },
    size: { width: 600, height: 400 },
    bounds: {
      minWidth: 400,
      minHeight: 300,
      maxWidth: 1200,
      maxHeight: 800
    },
    handleDragStop: vi.fn(),
    handleResizeStop: vi.fn()
  })
}));

// Mock StrudelRepl component
vi.mock('../StrudelRepl', () => ({
  StrudelRepl: ({ engineReady, statusLabel }: { engineReady: boolean; statusLabel: string }) => (
    <div data-testid="strudel-repl">
      Status: {statusLabel}
      Engine: {engineReady ? 'ready' : 'not ready'}
    </div>
  )
}));

describe('REPLWindow', () => {
  const defaultProps = {
    engineReady: false,
    onTestPattern: vi.fn(),
    onHalt: vi.fn(),
    onExecute: vi.fn(),
    onSave: vi.fn()
  };

  it('renders Rnd wrapper', () => {
    renderWithQueryClient(<REPLWindow {...defaultProps} />);
    expect(screen.getByTestId('rnd-wrapper')).toBeInTheDocument();
  });

  it('renders StrudelRepl component', () => {
    renderWithQueryClient(<REPLWindow {...defaultProps} />);
    expect(screen.getByTestId('strudel-repl')).toBeInTheDocument();
  });

  it('passes engineReady prop to StrudelRepl', () => {
    renderWithQueryClient(<REPLWindow {...defaultProps} engineReady={true} />);
    expect(screen.getByText(/Engine: ready/i)).toBeInTheDocument();
  });

  it('passes correct statusLabel when engine is ready', () => {
    renderWithQueryClient(<REPLWindow {...defaultProps} engineReady={true} />);
    expect(screen.getByText(/Status: ready/i)).toBeInTheDocument();
  });

  it('passes correct statusLabel when engine is stopped', () => {
    renderWithQueryClient(<REPLWindow {...defaultProps} engineReady={false} />);
    expect(screen.getByText(/Status: stopped/i)).toBeInTheDocument();
  });

  it('has z-30 className on Rnd wrapper', () => {
    renderWithQueryClient(<REPLWindow {...defaultProps} />);
    const rnd = screen.getByTestId('rnd-wrapper');
    expect(rnd).toHaveClass('z-30');
  });

  it('sets bounds to "window"', () => {
    renderWithQueryClient(<REPLWindow {...defaultProps} />);
    const rnd = screen.getByTestId('rnd-wrapper');
    expect(rnd).toHaveAttribute('data-bounds', 'window');
  });

  it('sets dragHandleClassName to "drag-handle"', () => {
    renderWithQueryClient(<REPLWindow {...defaultProps} />);
    const rnd = screen.getByTestId('rnd-wrapper');
    expect(rnd).toHaveAttribute('data-drag-handle-class-name', 'drag-handle');
  });
});
