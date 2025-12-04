import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { HydraCanvas } from '../HydraCanvas';

// Mock the useHydraHUD hook
vi.mock('../../hooks/useHydraHUD', () => ({
  useHydraHUD: () => ({ hudValue: 0.456 })
}));

describe('HydraCanvas', () => {
  it('renders canvas container with correct id', () => {
    const { container } = render(<HydraCanvas showStartupText={false} />);
    const canvas = container.querySelector('#hydra-container');
    expect(canvas).toBeInTheDocument();
  });

  it('shows startup text when showStartupText is true', () => {
    render(<HydraCanvas showStartupText={true} />);
    expect(screen.getByText(/Run code with/i)).toBeInTheDocument();
    expect(screen.getByText('await initHydra()')).toBeInTheDocument();
  });

  it('hides startup text when showStartupText is false', () => {
    render(<HydraCanvas showStartupText={false} />);
    expect(screen.queryByText(/Run code with/i)).not.toBeInTheDocument();
  });

  it('renders with correct background classes', () => {
    const { container } = render(<HydraCanvas showStartupText={false} />);
    const canvas = container.querySelector('#hydra-container');
    expect(canvas).toHaveClass('fixed', 'inset-0', 'z-0', 'bg-basilisk-black');
  });

  it('displays HUD label', () => {
    render(<HydraCanvas showStartupText={false} />);
    expect(screen.getByText('a.fft[0]')).toBeInTheDocument();
  });

  it('displays HUD value with correct precision', () => {
    render(<HydraCanvas showStartupText={false} />);
    // Mock returns 0.456, should display with 3 decimal places
    expect(screen.getByText('0.456')).toBeInTheDocument();
  });
});
