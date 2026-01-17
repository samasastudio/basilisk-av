import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ThemeProvider } from '../../contexts/ThemeContext';
import { StrudelRepl } from '../StrudelRepl';

// Helper to render with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

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

// Mock Strudel codemirror
vi.mock('@strudel/codemirror', () => ({
  sliderPlugin: vi.fn(() => ({})),
  sliderWithID: vi.fn(),
  updateSliderWidgets: vi.fn(),
  updateWidgets: vi.fn(),
  widgetPlugin: vi.fn(() => ({}))
}));

// Mock Strudel engine
vi.mock('../../services/strudelEngine', () => ({
  getReplInstance: vi.fn(),
  hushAudio: vi.fn()
}));

// Mock the useWidgetUpdates hook to avoid useSyncExternalStore issues in tests
vi.mock('../../hooks/useWidgetUpdates', () => ({
  useWidgetUpdates: vi.fn()
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AudioWaveform: () => <span>AudioWaveform Icon</span>,
  Music: () => <span>Music Icon</span>,
  Disc3: () => <span>Disc3 Icon</span>,
  Waves: () => <span>Waves Icon</span>,
  CircleDot: () => <span>CircleDot Icon</span>,
  Drum: () => <span>Drum Icon</span>,
  Sparkles: () => <span>Sparkles Icon</span>,
  Radio: () => <span>Radio Icon</span>,
  Piano: () => <span>Piano Icon</span>,
  Mic: () => <span>Mic Icon</span>,
  Wand2: () => <span>Wand2 Icon</span>,
  Leaf: () => <span>Leaf Icon</span>,
  Factory: () => <span>Factory Icon</span>,
  FolderOpen: () => <span>FolderOpen Icon</span>
}));

describe('StrudelRepl', () => {
  const mockSoundBrowser = {
    isOpen: false,
    open: vi.fn(),
    toggle: vi.fn(),
    close: vi.fn(),
    categories: [],
    filteredCategories: [],
    isLoading: false,
    error: null,
    groups: [],
    selectedGroup: 'all',
    setSelectedGroup: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    selectedCategory: null,
    setSelectedCategory: vi.fn(),
    previewSample: vi.fn(),
    stopPreview: vi.fn(),
    currentlyPlaying: null,
    canPreview: true
  };

  const mockPanelState = {
    activePanel: 'none' as const,
    openSoundBrowser: vi.fn(),
    openUserLibrary: vi.fn(),
    closePanel: vi.fn(),
    toggleSoundBrowser: vi.fn(),
    toggleUserLibrary: vi.fn(),
    isSoundBrowserOpen: false,
    isUserLibraryOpen: false
  };

  const mockUserLibrary = {
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
    source: null,
    setSource: vi.fn(),
    sourceName: null,
    items: [],
    flatItems: [],
    isLoading: false,
    error: null,
    isFileSystemSupported: true,
    linkLocalDirectory: vi.fn(),
    cdnUrl: null,
    linkCDN: vi.fn(),
    unlinkSource: vi.fn(),
    expandedPaths: new Set<string>(),
    toggleExpanded: vi.fn(),
    expandAll: vi.fn(),
    collapseAll: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    filteredItems: [],
    isRegistered: false,
    registeredCount: 0,
    getSampleUrl: vi.fn()
  };

  const defaultProps = {
    engineReady: true,
    onHalt: vi.fn(),
    onExecute: vi.fn(),
    onSave: vi.fn(),
    statusLabel: 'ready',
    soundBrowser: mockSoundBrowser,
    userLibrary: mockUserLibrary,
    panelState: mockPanelState,
    initialCode: null,
    isLoadingInitialCode: false,
    defaultScriptError: null,
    defaultScriptSource: null,
    onRetryDefaultScript: undefined,
    isLoadingDefaultLibrary: false,
    defaultLibraryError: null,
    defaultLibrarySource: null,
    onRetryDefaultLibrary: undefined
  };

  it('renders the editor', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} />);
    expect(screen.getByTestId('codemirror-editor')).toBeInTheDocument();
  });

  it('calls onSave when Ctrl+S is pressed', () => {
    const onSave = vi.fn();
    renderWithTheme(<StrudelRepl {...defaultProps} onSave={onSave} />);

    const editor = screen.getByTestId('codemirror-editor');
    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.any(String));
  });

  it('calls onSave when Cmd+S is pressed (Mac)', () => {
    const onSave = vi.fn();
    renderWithTheme(<StrudelRepl {...defaultProps} onSave={onSave} />);

    const editor = screen.getByTestId('codemirror-editor');
    fireEvent.keyDown(editor, { key: 's', metaKey: true });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.any(String));
  });

  it('does not call onSave when S is pressed without modifier', () => {
    const onSave = vi.fn();
    renderWithTheme(<StrudelRepl {...defaultProps} onSave={onSave} />);

    const editor = screen.getByTestId('codemirror-editor');
    fireEvent.keyDown(editor, { key: 's' });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not call onSave if onSave prop is not provided', () => {
    renderWithTheme(
      <StrudelRepl
        engineReady={true}
        statusLabel="ready"
        soundBrowser={mockSoundBrowser}
        userLibrary={mockUserLibrary}
        panelState={mockPanelState}
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
    renderWithTheme(<StrudelRepl {...defaultProps} onSave={onSave} />);

    const editor = screen.getByTestId('codemirror-editor') as HTMLTextAreaElement;

    // The default code should be in the editor
    const currentCode = editor.value;

    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

    expect(onSave).toHaveBeenCalledWith(currentCode);
  });

  it('uses initialCode when provided', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} initialCode="// loaded script" />);
    const editor = screen.getByTestId('codemirror-editor') as HTMLTextAreaElement;
    expect(editor.value).toBe('// loaded script');
  });

  it('keeps user edits when initialCode changes', () => {
    const { rerender } = renderWithTheme(<StrudelRepl {...defaultProps} initialCode="// loaded script" />);
    const editor = screen.getByTestId('codemirror-editor') as HTMLTextAreaElement;

    fireEvent.change(editor, { target: { value: '// user edits' } });

    rerender(
      <ThemeProvider>
        <StrudelRepl {...defaultProps} initialCode="// new script" />
      </ThemeProvider>
    );

    const updatedEditor = screen.getByTestId('codemirror-editor') as HTMLTextAreaElement;
    expect(updatedEditor.value).toBe('// user edits');
  });

  it('shows loading state when initial code is loading', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} isLoadingInitialCode={true} />);
    expect(screen.getByText(/Loading startup script/i)).toBeInTheDocument();
  });

  it('renders Execute button', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} />);
    expect(screen.getByText(/Execute/i)).toBeInTheDocument();
  });

  it('renders Halt button', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} />);
    expect(screen.getByText(/Halt/i)).toBeInTheDocument();
  });

  it('renders Sounds browser toggle button', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} />);
    // The Music icon button (3rd button after Execute and Halt)
    const buttons = screen.getAllByRole('button');
    // Should have Execute, Halt, and Sounds buttons
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    const soundsButton = buttons.find(btn => btn.textContent?.includes('Music Icon'));
    expect(soundsButton).toBeDefined();
  });

  it('Sounds button is disabled when engine is not ready', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} engineReady={false} />);
    const buttons = screen.getAllByRole('button');
    const soundsButton = buttons.find(btn => btn.textContent?.includes('Music Icon'));
    expect(soundsButton).toBeDefined();
    expect(soundsButton).toBeDisabled();
  });

  it('displays status label', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} statusLabel="testing" />);
    expect(screen.getByText('testing')).toBeInTheDocument();
  });

  it('shows ready indicator when engine is ready', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} engineReady={true} />);
    expect(screen.getByText('●')).toBeInTheDocument();
  });

  it('shows not-ready indicator when engine is not ready', () => {
    renderWithTheme(<StrudelRepl {...defaultProps} engineReady={false} />);
    expect(screen.getByText('○')).toBeInTheDocument();
  });

  // Default code tests for Hydra auto-initialization feature
  describe('default code', () => {
    it('does not contain initHydra call', () => {
      renderWithTheme(<StrudelRepl {...defaultProps} />);
      const editor = screen.getByTestId('codemirror-editor') as HTMLTextAreaElement;
      const code = editor.value;

      expect(code).not.toContain('initHydra');
      expect(code).not.toContain('await initHydra');
    });

    it('contains Hydra visual functions', () => {
      renderWithTheme(<StrudelRepl {...defaultProps} />);
      const editor = screen.getByTestId('codemirror-editor') as HTMLTextAreaElement;
      const code = editor.value;

      // Should contain Hydra functions
      expect(code).toContain('src(o0)');
      expect(code).toContain('noise(');
      expect(code).toContain('.out(');
      expect(code).toContain('render(o0)');
    });

    it('contains Strudel audio patterns', () => {
      renderWithTheme(<StrudelRepl {...defaultProps} />);
      const editor = screen.getByTestId('codemirror-editor') as HTMLTextAreaElement;
      const code = editor.value;

      // Should contain Strudel patterns
      expect(code).toContain('s("');
    });

    it('contains FFT reactive code', () => {
      renderWithTheme(<StrudelRepl {...defaultProps} />);
      const editor = screen.getByTestId('codemirror-editor') as HTMLTextAreaElement;
      const code = editor.value;

      // Should contain a.fft for audio reactivity
      expect(code).toContain('a.fft');
    });
  });
});
