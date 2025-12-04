import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { AppHeader } from '../AppHeader';

describe('AppHeader', () => {
  const defaultProps = {
    engineInitialized: false,
    isInitializing: false,
    hydraLinked: false,
    hydraStatus: 'none',
    onStartEngine: vi.fn()
  };

  it('renders BASILISK branding', () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText('BASILISK')).toBeInTheDocument();
  });

  it('renders version number', () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });

  it('shows stopped audio status when engine not initialized', () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText(/Audio: stopped/i)).toBeInTheDocument();
  });

  it('shows running audio status when engine initialized', () => {
    render(<AppHeader {...defaultProps} engineInitialized={true} />);
    expect(screen.getByText(/Audio: running/i)).toBeInTheDocument();
  });

  it('shows correct audio indicator when engine stopped', () => {
    render(<AppHeader {...defaultProps} />);
    const indicator = screen.getByText(/Audio: stopped/i).previousSibling;
    expect(indicator?.textContent).toBe('○');
  });

  it('shows correct audio indicator when engine running', () => {
    render(<AppHeader {...defaultProps} engineInitialized={true} />);
    const indicator = screen.getByText(/Audio: running/i).previousSibling;
    expect(indicator?.textContent).toBe('●');
  });

  it('shows disconnected Hydra status', () => {
    render(<AppHeader {...defaultProps} hydraStatus="none" />);
    expect(screen.getByText(/Hydra: none/i)).toBeInTheDocument();
  });

  it('shows connected Hydra status when linked', () => {
    render(
      <AppHeader
        {...defaultProps}
        hydraLinked={true}
        hydraStatus="Strudel (a.fft)"
      />
    );
    expect(screen.getByText(/Hydra: Strudel \(a\.fft\)/i)).toBeInTheDocument();
  });

  it('shows correct Hydra indicator when disconnected', () => {
    render(<AppHeader {...defaultProps} />);
    const indicator = screen.getByText(/Hydra:/i).previousSibling;
    expect(indicator?.textContent).toBe('○');
  });

  it('shows correct Hydra indicator when connected', () => {
    render(<AppHeader {...defaultProps} hydraLinked={true} />);
    const indicator = screen.getByText(/Hydra:/i).previousSibling;
    expect(indicator?.textContent).toBe('●');
  });

  it('calls onStartEngine when button clicked', async () => {
    const onStartEngine = vi.fn();
    render(<AppHeader {...defaultProps} onStartEngine={onStartEngine} />);

    const button = screen.getByRole('button', { name: /Start Audio/i });
    await userEvent.click(button);

    expect(onStartEngine).toHaveBeenCalledTimes(1);
  });

  it('disables button when initializing', () => {
    render(<AppHeader {...defaultProps} isInitializing={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when engine already initialized', () => {
    render(<AppHeader {...defaultProps} engineInitialized={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows "Start Audio" text when idle', () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Start Audio/i })).toBeInTheDocument();
  });

  it('shows "Starting…" text when initializing', () => {
    render(<AppHeader {...defaultProps} isInitializing={true} />);
    expect(screen.getByRole('button', { name: /Starting…/i })).toBeInTheDocument();
  });

  it('shows "Running" text when initialized', () => {
    render(<AppHeader {...defaultProps} engineInitialized={true} />);
    expect(screen.getByRole('button', { name: /Running/i })).toBeInTheDocument();
  });
});
