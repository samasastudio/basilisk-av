import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { StrudelRepl } from '../StrudelRepl';

// Mock CodeMirror component
vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onKeyDown, onChange }: {
    value: string;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onChange: (value: string) => void;
  }) => (
    <textarea
      data-testid="codemirror-editor"
      value={value}
      onKeyDown={onKeyDown}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}));

// Mock CodeMirror language and view
vi.mock('@codemirror/lang-javascript', () => ({
  javascript: () => ({})
}));

vi.mock('@codemirror/view', () => ({
  EditorView: {
    theme: () => ({})
  }
}));

// Mock Strudel modules
vi.mock('@strudel/core', () => ({}));
vi.mock('@strudel/hydra', () => ({
  initHydra: vi.fn(),
  H: {}
}));
vi.mock('@strudel/webaudio', () => ({
  samples: {}
}));

// Mock Strudel engine
vi.mock('../../services/strudelEngine', () => ({
  getReplInstance: vi.fn(),
  hushAudio: vi.fn()
}));

describe('StrudelRepl', () => {
  const defaultProps = {
    engineReady: true,
    onTestPattern: vi.fn(),
    onHalt: vi.fn(),
    onExecute: vi.fn(),
    onSave: vi.fn(),
    statusLabel: 'ready'
  };

  it('renders the editor', () => {
    render(<StrudelRepl {...defaultProps} />);
    expect(screen.getByTestId('codemirror-editor')).toBeInTheDocument();
  });

  it('calls onSave when Ctrl+S is pressed', () => {
    const onSave = vi.fn();
    render(<StrudelRepl {...defaultProps} onSave={onSave} />);

    const editor = screen.getByTestId('codemirror-editor');
    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.any(String));
  });

  it('calls onSave when Cmd+S is pressed (Mac)', () => {
    const onSave = vi.fn();
    render(<StrudelRepl {...defaultProps} onSave={onSave} />);

    const editor = screen.getByTestId('codemirror-editor');
    fireEvent.keyDown(editor, { key: 's', metaKey: true });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.any(String));
  });

  it('does not call onSave when S is pressed without modifier', () => {
    const onSave = vi.fn();
    render(<StrudelRepl {...defaultProps} onSave={onSave} />);

    const editor = screen.getByTestId('codemirror-editor');
    fireEvent.keyDown(editor, { key: 's' });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not call onSave if onSave prop is not provided', () => {
    render(
      <StrudelRepl
        engineReady={true}
        statusLabel="ready"
      />
    );

    const editor = screen.getByTestId('codemirror-editor');

    // Should not throw
    expect(() => {
      fireEvent.keyDown(editor, { key: 's', ctrlKey: true });
    }).not.toThrow();
  });

  it('passes current code to onSave', () => {
    const onSave = vi.fn();
    render(<StrudelRepl {...defaultProps} onSave={onSave} />);

    const editor = screen.getByTestId('codemirror-editor') as HTMLTextAreaElement;

    // The default code should be in the editor
    const currentCode = editor.value;

    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

    expect(onSave).toHaveBeenCalledWith(currentCode);
  });

  it('renders Execute button', () => {
    render(<StrudelRepl {...defaultProps} />);
    expect(screen.getByText(/Execute/i)).toBeInTheDocument();
  });

  it('renders Halt button', () => {
    render(<StrudelRepl {...defaultProps} />);
    expect(screen.getByText(/Halt/i)).toBeInTheDocument();
  });

  it('renders Test button when onTestPattern is provided', () => {
    render(<StrudelRepl {...defaultProps} onTestPattern={vi.fn()} />);
    expect(screen.getByText(/Test/i)).toBeInTheDocument();
  });

  it('does not render Test button when onTestPattern is not provided', () => {
    const props = { ...defaultProps };
    delete (props as Partial<typeof props>).onTestPattern;

    render(<StrudelRepl {...props} />);
    expect(screen.queryByText(/Test/i)).not.toBeInTheDocument();
  });

  it('displays status label', () => {
    render(<StrudelRepl {...defaultProps} statusLabel="testing" />);
    expect(screen.getByText('testing')).toBeInTheDocument();
  });

  it('shows ready indicator when engine is ready', () => {
    render(<StrudelRepl {...defaultProps} engineReady={true} />);
    expect(screen.getByText('●')).toBeInTheDocument();
  });

  it('shows not-ready indicator when engine is not ready', () => {
    render(<StrudelRepl {...defaultProps} engineReady={false} />);
    expect(screen.getByText('○')).toBeInTheDocument();
  });
});
