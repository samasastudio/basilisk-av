import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { ThemeProvider } from '../../contexts/ThemeContext';
import { AppHeader } from '../AppHeader';

import type { EngineStatus } from '../../types/engine';
import type { ReactNode } from 'react';

// Wrapper to provide ThemeContext
const renderWithTheme = (ui: ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('AppHeader', () => {
  const defaultProps = {
    engineStatus: 'idle' as EngineStatus,
    hydraLinked: false,
    hydraStatus: 'none',
    onStartEngine: vi.fn()
  };

  it('renders BASILISK branding', () => {
    renderWithTheme(<AppHeader {...defaultProps} />);
    expect(screen.getByText('BASILISK')).toBeInTheDocument();
  });

  it('renders version number', () => {
    renderWithTheme(<AppHeader {...defaultProps} />);
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });

  it('shows stopped audio status when engine is idle', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="idle" />);
    expect(screen.getByText(/Audio: stopped/i)).toBeInTheDocument();
  });

  it('shows starting audio status when engine is initializing', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="initializing" />);
    expect(screen.getByText(/Audio: starting/i)).toBeInTheDocument();
  });

  it('shows running audio status when engine is ready', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="ready" />);
    expect(screen.getByText(/Audio: running/i)).toBeInTheDocument();
  });

  it('shows error audio status when engine has error', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="error" />);
    expect(screen.getByText(/Audio: error/i)).toBeInTheDocument();
  });

  it('shows correct audio indicator when engine stopped', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="idle" />);
    const indicator = screen.getByText(/Audio: stopped/i).previousSibling;
    expect(indicator?.textContent).toBe('○');
  });

  it('shows correct audio indicator when engine running', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="ready" />);
    const indicator = screen.getByText(/Audio: running/i).previousSibling;
    expect(indicator?.textContent).toBe('●');
  });

  it('shows disconnected Hydra status', () => {
    renderWithTheme(<AppHeader {...defaultProps} hydraStatus="none" />);
    expect(screen.getByText(/Hydra: none/i)).toBeInTheDocument();
  });

  it('shows connected Hydra status when linked', () => {
    renderWithTheme(
      <AppHeader
        {...defaultProps}
        hydraLinked={true}
        hydraStatus="Strudel (a.fft)"
      />
    );
    expect(screen.getByText(/Hydra: Strudel \(a\.fft\)/i)).toBeInTheDocument();
  });

  it('shows correct Hydra indicator when disconnected', () => {
    renderWithTheme(<AppHeader {...defaultProps} />);
    const indicator = screen.getByText(/Hydra:/i).previousSibling;
    expect(indicator?.textContent).toBe('○');
  });

  it('shows correct Hydra indicator when connected', () => {
    renderWithTheme(<AppHeader {...defaultProps} hydraLinked={true} />);
    const indicator = screen.getByText(/Hydra:/i).previousSibling;
    expect(indicator?.textContent).toBe('●');
  });

  it('calls onStartEngine when button clicked', async () => {
    const onStartEngine = vi.fn();
    renderWithTheme(<AppHeader {...defaultProps} onStartEngine={onStartEngine} />);

    const button = screen.getByRole('button', { name: /Start Audio/i });
    await userEvent.click(button);

    expect(onStartEngine).toHaveBeenCalledTimes(1);
  });

  it('disables button when initializing', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="initializing" />);
    const button = screen.getByRole('button', { name: /Starting/i });
    expect(button).toBeDisabled();
  });

  it('disables button when engine is ready', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="ready" />);
    const button = screen.getByRole('button', { name: /Running/i });
    expect(button).toBeDisabled();
  });

  it('enables button when engine is idle', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="idle" />);
    const button = screen.getByRole('button', { name: /Start Audio/i });
    expect(button).not.toBeDisabled();
  });

  it('enables button when engine has error (allows retry)', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="error" />);
    const button = screen.getByRole('button', { name: /Start Audio/i });
    expect(button).not.toBeDisabled();
  });

  it('shows "Start Audio" text when idle', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="idle" />);
    expect(screen.getByRole('button', { name: /Start Audio/i })).toBeInTheDocument();
  });

  it('shows "Start Audio" text when in error state', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="error" />);
    expect(screen.getByRole('button', { name: /Start Audio/i })).toBeInTheDocument();
  });

  it('shows "Starting…" text when initializing', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="initializing" />);
    expect(screen.getByRole('button', { name: /Starting…/i })).toBeInTheDocument();
  });

  it('shows "Running" text when ready', () => {
    renderWithTheme(<AppHeader {...defaultProps} engineStatus="ready" />);
    expect(screen.getByRole('button', { name: /Running/i })).toBeInTheDocument();
  });

  // Theme toggle button tests
  it('renders theme toggle button', () => {
    renderWithTheme(<AppHeader {...defaultProps} />);
    // Default is light mode, so button says "Switch to dark mode"
    expect(screen.getByRole('button', { name: /Switch to dark mode/i })).toBeInTheDocument();
  });

  it('shows sun icon in light mode (default)', () => {
    renderWithTheme(<AppHeader {...defaultProps} />);
    // Light mode shows sun icon (click to go dark)
    const themeButton = screen.getByRole('button', { name: /Switch to dark mode/i });
    // Sun icon has a circle element
    expect(themeButton.querySelector('circle')).toBeInTheDocument();
  });

  it('toggles theme when button clicked', async () => {
    renderWithTheme(<AppHeader {...defaultProps} />);
    // Start in light mode
    const themeButton = screen.getByRole('button', { name: /Switch to dark mode/i });

    await userEvent.click(themeButton);

    // After click, should be in dark mode showing "Switch to light mode"
    expect(screen.getByRole('button', { name: /Switch to light mode/i })).toBeInTheDocument();
  });
});
