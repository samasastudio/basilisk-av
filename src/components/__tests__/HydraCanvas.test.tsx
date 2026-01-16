import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ThemeProvider } from '../../contexts/ThemeContext';
import { HydraCanvas } from '../HydraCanvas';

// Mock the useHydraHUD hook
vi.mock('../../hooks/useHydraHUD', () => ({
  useHydraHUD: () => ({ hudValue: 0.456 })
}));

// Helper to render with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe('HydraCanvas', () => {
  it('renders canvas container with correct id', () => {
    const { container } = renderWithTheme(<HydraCanvas showStartupText={false} />);
    const canvas = container.querySelector('#hydra-container');
    expect(canvas).toBeInTheDocument();
  });

  it('shows startup text when showStartupText is true', () => {
    renderWithTheme(<HydraCanvas showStartupText={true} />);
    expect(screen.getByText(/Press/i)).toBeInTheDocument();
    expect(screen.getByText('Ctrl+Shift+Space')).toBeInTheDocument();
    expect(screen.getByText('Start Audio')).toBeInTheDocument();
  });

  it('shows new startup text without initHydra mention', () => {
    renderWithTheme(<HydraCanvas showStartupText={true} />);
    // Should NOT mention initHydra anymore
    expect(screen.queryByText(/initHydra/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/await initHydra/i)).not.toBeInTheDocument();
  });

  it('hides startup text when showStartupText is false', () => {
    renderWithTheme(<HydraCanvas showStartupText={false} />);
    expect(screen.queryByText(/Press/i)).not.toBeInTheDocument();
  });

  it('renders with correct background classes', () => {
    const { container } = renderWithTheme(<HydraCanvas showStartupText={false} />);
    const canvas = container.querySelector('#hydra-container');
    expect(canvas).toHaveClass('fixed', 'inset-0', 'z-0', 'bg-basilisk-black');
  });

  it('displays HUD label', () => {
    renderWithTheme(<HydraCanvas showStartupText={false} />);
    expect(screen.getByText('a.fft[0]')).toBeInTheDocument();
  });

  it('displays HUD value with correct precision', () => {
    renderWithTheme(<HydraCanvas showStartupText={false} />);
    // Mock returns 0.456, should display with 3 decimal places
    expect(screen.getByText('0.456')).toBeInTheDocument();
  });
});
