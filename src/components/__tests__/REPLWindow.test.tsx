import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { REPLWindow } from '../REPLWindow';

// Mock the Rnd component
vi.mock('react-rnd', () => ({
  Rnd: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="rnd-wrapper" {...props}>
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
    onExecute: vi.fn()
  };

  it('renders Rnd wrapper', () => {
    render(<REPLWindow {...defaultProps} />);
    expect(screen.getByTestId('rnd-wrapper')).toBeInTheDocument();
  });

  it('renders StrudelRepl component', () => {
    render(<REPLWindow {...defaultProps} />);
    expect(screen.getByTestId('strudel-repl')).toBeInTheDocument();
  });

  it('passes engineReady prop to StrudelRepl', () => {
    render(<REPLWindow {...defaultProps} engineReady={true} />);
    expect(screen.getByText(/Engine: ready/i)).toBeInTheDocument();
  });

  it('passes correct statusLabel when engine is ready', () => {
    render(<REPLWindow {...defaultProps} engineReady={true} />);
    expect(screen.getByText(/Status: ready/i)).toBeInTheDocument();
  });

  it('passes correct statusLabel when engine is stopped', () => {
    render(<REPLWindow {...defaultProps} engineReady={false} />);
    expect(screen.getByText(/Status: stopped/i)).toBeInTheDocument();
  });

  it('has z-30 className on Rnd wrapper', () => {
    render(<REPLWindow {...defaultProps} />);
    const rnd = screen.getByTestId('rnd-wrapper');
    expect(rnd).toHaveClass('z-30');
  });

  it('sets bounds to "window"', () => {
    render(<REPLWindow {...defaultProps} />);
    const rnd = screen.getByTestId('rnd-wrapper');
    expect(rnd).toHaveAttribute('bounds', 'window');
  });

  it('sets dragHandleClassName to "drag-handle"', () => {
    render(<REPLWindow {...defaultProps} />);
    const rnd = screen.getByTestId('rnd-wrapper');
    expect(rnd).toHaveAttribute('dragHandleClassName', 'drag-handle');
  });
});
