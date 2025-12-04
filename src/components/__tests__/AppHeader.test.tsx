import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { AppHeader } from '../AppHeader';

import type { EngineStatus } from '../../types/engine';

describe('AppHeader', () => {
  const defaultProps = {
    engineStatus: 'idle' as EngineStatus,
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

  it('shows stopped audio status when engine is idle', () => {
    render(<AppHeader {...defaultProps} engineStatus="idle" />);
    expect(screen.getByText(/Audio: stopped/i)).toBeInTheDocument();
  });

  it('shows starting audio status when engine is initializing', () => {
    render(<AppHeader {...defaultProps} engineStatus="initializing" />);
    expect(screen.getByText(/Audio: starting/i)).toBeInTheDocument();
  });

  it('shows running audio status when engine is ready', () => {
    render(<AppHeader {...defaultProps} engineStatus="ready" />);
    expect(screen.getByText(/Audio: running/i)).toBeInTheDocument();
  });

  it('shows error audio status when engine has error', () => {
    render(<AppHeader {...defaultProps} engineStatus="error" />);
    expect(screen.getByText(/Audio: error/i)).toBeInTheDocument();
  });

  it('shows correct audio indicator when engine stopped', () => {
    render(<AppHeader {...defaultProps} engineStatus="idle" />);
    const indicator = screen.getByText(/Audio: stopped/i).previousSibling;
    expect(indicator?.textContent).toBe('○');
  });

  it('shows correct audio indicator when engine running', () => {
    render(<AppHeader {...defaultProps} engineStatus="ready" />);
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
    render(<AppHeader {...defaultProps} engineStatus="initializing" />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when engine is ready', () => {
    render(<AppHeader {...defaultProps} engineStatus="ready" />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('enables button when engine is idle', () => {
    render(<AppHeader {...defaultProps} engineStatus="idle" />);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('enables button when engine has error (allows retry)', () => {
    render(<AppHeader {...defaultProps} engineStatus="error" />);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('shows "Start Audio" text when idle', () => {
    render(<AppHeader {...defaultProps} engineStatus="idle" />);
    expect(screen.getByRole('button', { name: /Start Audio/i })).toBeInTheDocument();
  });

  it('shows "Start Audio" text when in error state', () => {
    render(<AppHeader {...defaultProps} engineStatus="error" />);
    expect(screen.getByRole('button', { name: /Start Audio/i })).toBeInTheDocument();
  });

  it('shows "Starting…" text when initializing', () => {
    render(<AppHeader {...defaultProps} engineStatus="initializing" />);
    expect(screen.getByRole('button', { name: /Starting…/i })).toBeInTheDocument();
  });

  it('shows "Running" text when ready', () => {
    render(<AppHeader {...defaultProps} engineStatus="ready" />);
    expect(screen.getByRole('button', { name: /Running/i })).toBeInTheDocument();
  });
});
