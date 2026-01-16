import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { App } from '../App';

// Mock @strudel/web module
vi.mock('@strudel/web', () => ({
  initStrudel: vi.fn().mockResolvedValue({
    evaluate: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock react-rnd to avoid layout issues in tests
vi.mock('react-rnd', () => ({
  Rnd: ({ children }: { children: React.ReactNode }) => <div data-testid="rnd-container">{children}</div>,
}));

describe('App - Baseline Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the application', () => {
    render(<App />);
    expect(screen.getByText('BASILISK')).toBeInTheDocument();
  });

  it('shows startup text by default', () => {
    render(<App />);
    expect(screen.getByText(/Press/i)).toBeInTheDocument();
    expect(screen.getByText('Ctrl+Shift+Space')).toBeInTheDocument();
    // "Start Audio" appears as both startup text (in code tag) and button
    // Verify at least one instance is present
    expect(screen.getAllByText('Start Audio').length).toBeGreaterThanOrEqual(1);
  });

  it('shows engine as stopped initially', () => {
    render(<App />);
    expect(screen.getByText(/Audio: stopped/i)).toBeInTheDocument();
  });

  it('shows Hydra as none initially', () => {
    render(<App />);
    expect(screen.getByText(/Hydra: none/i)).toBeInTheDocument();
  });

  it('Start Audio button is enabled initially', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Start Audio/i });
    expect(button).not.toBeDisabled();
  });

  it('renders REPL editor', () => {
    render(<App />);
    expect(screen.getByTestId('rnd-container')).toBeInTheDocument();
  });

  it('displays version number', () => {
    render(<App />);
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });

  it('shows Execute button in REPL', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Execute/i })).toBeInTheDocument();
  });

  it('shows Halt button in REPL', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Halt/i })).toBeInTheDocument();
  });
});
