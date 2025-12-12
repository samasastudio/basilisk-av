# User Library Specification

## Overview

The User Library is a sample browser for user-provided audio files, complementing the built-in Sound Browser (Strudel samples). It allows users to link a master directory of their own samples and browse them with the same UX patterns as the Sound Browser.

## Design Principles

1. **Reuse over duplication** - Share components with Sound Browser
2. **Directory-first** - Respect user's folder organization
3. **Mutual exclusivity** - Only one panel open at a time
4. **Minimal friction** - Quick access to frequently used samples

## Architecture

### Component Hierarchy

```
src/components/
├── panels/
│   ├── SamplePanel.tsx          # Shared base component (NEW)
│   ├── SamplePanelHeader.tsx    # Title, search, close button
│   ├── SamplePanelTree.tsx      # Collapsible directory tree
│   └── SamplePanelItem.tsx      # Individual sample row
├── SoundBrowser/
│   └── SoundBrowser.tsx         # Uses SamplePanel + Strudel data
├── UserLibrary/
│   ├── UserLibrary.tsx          # Uses SamplePanel + user data
│   ├── useUserLibrary.ts        # Hook for file system access
│   └── UserLibraryLink.tsx      # Directory picker UI
└── header/
    └── AppHeader.tsx            # Both toggle buttons
```

### State Management

```typescript
// Panel state - single source of truth
type ActivePanel = 'none' | 'sound-browser' | 'user-library';

// App-level state
const [activePanel, setActivePanel] = useState<ActivePanel>('none');

// Toggle handlers ensure exclusivity
const toggleSoundBrowser = () => 
  setActivePanel(prev => prev === 'sound-browser' ? 'none' : 'sound-browser');

const toggleUserLibrary = () => 
  setActivePanel(prev => prev === 'user-library' ? 'none' : 'user-library');
```

### Data Structures

```typescript
// Shared sample item interface
interface SampleItem {
  id: string;
  name: string;
  type: 'directory' | 'sample';
  path: string;
  children?: SampleItem[];  // For directories
  format?: string;          // For samples: 'wav', 'mp3', etc.
}

// User Library specific
interface UserLibraryState {
  linkedPath: string | null;
  items: SampleItem[];
  isLoading: boolean;
  error: string | null;
}
```

## Shared Base Component: SamplePanel

### Props Interface

```typescript
interface SamplePanelProps {
  title: string;
  icon: ReactNode;
  items: SampleItem[];
  isOpen: boolean;
  onClose: () => void;
  onItemClick?: (item: SampleItem) => void;
  onItemDoubleClick?: (item: SampleItem) => void;
  searchable?: boolean;
  emptyState?: ReactNode;
  headerActions?: ReactNode;  // For "Link Directory" button
}
```

### Usage

```tsx
// Sound Browser
<SamplePanel
  title="Sound Browser"
  icon={<VolumeIcon />}
  items={strudelSamples}
  isOpen={activePanel === 'sound-browser'}
  onClose={() => setActivePanel('none')}
  onItemClick={previewSample}
  onItemDoubleClick={insertSample}
  searchable
/>

// User Library
<SamplePanel
  title="User Library"
  icon={<WaveformIcon />}
  items={userSamples}
  isOpen={activePanel === 'user-library'}
  onClose={() => setActivePanel('none')}
  onItemClick={previewUserSample}
  onItemDoubleClick={insertUserSample}
  searchable
  headerActions={<LinkDirectoryButton />}
  emptyState={<LinkDirectoryPrompt />}
/>
```

## User Library Specifics

### Directory Linking

Uses File System Access API (Chrome/Edge) with localStorage fallback:

```typescript
// useUserLibrary.ts
const useUserLibrary = () => {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [linkedPath, setLinkedPath] = usePersistedState<string | null>('userLibraryPath', null);
  
  const linkDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
      setLinkedPath(handle.name);
      await scanDirectory(handle);
    } catch (err) {
      // User cancelled or API not supported
    }
  };
  
  const scanDirectory = async (handle: FileSystemDirectoryHandle): Promise<SampleItem[]> => {
    const items: SampleItem[] = [];
    for await (const entry of handle.values()) {
      if (entry.kind === 'directory') {
        const subHandle = await handle.getDirectoryHandle(entry.name);
        items.push({
          id: entry.name,
          name: entry.name,
          type: 'directory',
          path: entry.name,
          children: await scanDirectory(subHandle)
        });
      } else if (isAudioFile(entry.name)) {
        items.push({
          id: entry.name,
          name: entry.name,
          type: 'sample',
          path: entry.name,
          format: getAudioFormat(entry.name)
        });
      }
    }
    return items.sort(sortDirectoriesFirst);
  };
  
  return { linkedPath, items, linkDirectory, isLoading, error };
};

const isAudioFile = (name: string): boolean => 
  /\.(wav|mp3|ogg|flac|aiff?)$/i.test(name);
```

### Preview Playback

```typescript
// Preview user samples via Web Audio API
const previewUserSample = async (item: SampleItem) => {
  if (item.type !== 'sample' || !directoryHandle) return;
  
  const fileHandle = await getFileHandle(directoryHandle, item.path);
  const file = await fileHandle.getFile();
  const arrayBuffer = await file.arrayBuffer();
  
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  
  // Store reference to stop on next preview
  setCurrentPreview({ source, context: audioContext });
};
```

### Insert Path

```typescript
// Format path for Strudel samples() function
const insertUserSample = (item: SampleItem) => {
  if (item.type !== 'sample') return;
  
  // Get full path relative to linked directory
  const samplePath = item.path;
  
  // Format for Strudel: samples({ name: 'path/to/sample.wav' })
  const insertText = `samples({ ${item.name.replace(/\.\w+$/, '')}: '${samplePath}' })`;
  
  insertAtCursor(insertText);
  focusEditor();
};
```

## UI Components

### Header Button

```tsx
// Waveform icon for User Library (distinct from Sound Browser volume icon)
const WaveformIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M4 12h2v4H4v-4zm4-6h2v16H8V6zm4-2h2v20h-2V4zm4 4h2v12h-2V8zm4 2h2v8h-2v-8z" />
  </svg>
);

// In AppHeader.tsx
<HeaderButton
  icon={<VolumeIcon />}
  tooltip="Sound Browser"
  isActive={activePanel === 'sound-browser'}
  onClick={toggleSoundBrowser}
/>
<HeaderButton
  icon={<WaveformIcon />}
  tooltip="User Library"
  isActive={activePanel === 'user-library'}
  onClick={toggleUserLibrary}
/>
```

### Empty State (No Directory Linked)

```tsx
const LinkDirectoryPrompt = ({ onLink }: { onLink: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <WaveformIcon className="w-12 h-12 text-zinc-500 mb-4" />
    <h3 className="text-zinc-300 font-medium mb-2">No samples linked</h3>
    <p className="text-zinc-500 text-sm mb-4">
      Link a folder to browse your sample collection
    </p>
    <button
      onClick={onLink}
      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
    >
      Link Directory
    </button>
  </div>
);
```

### Directory Tree Item

```tsx
const SamplePanelItem = ({ 
  item, 
  depth = 0,
  onItemClick,
  onItemDoubleClick,
  isPlaying 
}: SamplePanelItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (item.type === 'directory') {
    return (
      <div>
        <button
          className="flex items-center w-full px-2 py-1 hover:bg-zinc-700/50"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronIcon className={isExpanded ? 'rotate-90' : ''} />
          <FolderIcon className="w-4 h-4 mr-2 text-zinc-400" />
          <span className="text-zinc-300">{item.name}</span>
          <span className="ml-auto text-zinc-500 text-xs">
            {item.children?.length || 0}
          </span>
        </button>
        {isExpanded && item.children?.map(child => (
          <SamplePanelItem 
            key={child.id} 
            item={child} 
            depth={depth + 1}
            onItemClick={onItemClick}
            onItemDoubleClick={onItemDoubleClick}
          />
        ))}
      </div>
    );
  }
  
  return (
    <button
      className={`flex items-center w-full px-2 py-1 hover:bg-zinc-700/50 ${
        isPlaying ? 'bg-zinc-700' : ''
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={() => onItemClick?.(item)}
      onDoubleClick={() => onItemDoubleClick?.(item)}
    >
      <AudioFileIcon className="w-4 h-4 mr-2 text-zinc-500" />
      <span className="text-zinc-300 truncate">{item.name}</span>
      {isPlaying && <PlayingIndicator />}
    </button>
  );
};
```

## Browser Compatibility

### File System Access API

- ✅ Chrome 86+
- ✅ Edge 86+
- ❌ Firefox (use fallback)
- ❌ Safari (use fallback)

### Fallback Strategy

For browsers without File System Access API:

```typescript
const linkDirectoryFallback = () => {
  // Create hidden file input for multiple files
  const input = document.createElement('input');
  input.type = 'file';
  input.webkitdirectory = true;
  input.multiple = true;
  
  input.onchange = (e) => {
    const files = Array.from(input.files || []);
    const items = buildTreeFromFiles(files);
    setItems(items);
  };
  
  input.click();
};

// Note: This approach loses directory handle, so preview/reload
// requires re-selecting the directory
```

## Styling

Follows basilisk-style guidelines:

```css
/* Panel container */
.sample-panel {
  @apply bg-zinc-900/80 backdrop-blur-md;
  @apply border border-zinc-700/50;
  @apply rounded-lg shadow-xl;
  @apply w-72 max-h-96 overflow-hidden;
}

/* Header */
.sample-panel-header {
  @apply flex items-center justify-between;
  @apply px-3 py-2 border-b border-zinc-700/50;
}

/* Search input */
.sample-panel-search {
  @apply w-full px-3 py-1.5;
  @apply bg-zinc-800 border border-zinc-700;
  @apply rounded text-sm text-zinc-300;
  @apply placeholder-zinc-500;
  @apply focus:outline-none focus:border-zinc-500;
}

/* Item hover */
.sample-item:hover {
  @apply bg-zinc-700/50;
}

/* Playing indicator */
.playing-indicator {
  @apply w-2 h-2 rounded-full bg-green-500;
  @apply animate-pulse;
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('SamplePanel', () => {
  it('renders title and items', () => {});
  it('expands/collapses directories', () => {});
  it('calls onItemClick on single click', () => {});
  it('calls onItemDoubleClick on double click', () => {});
  it('filters items when searching', () => {});
  it('shows empty state when no items', () => {});
});

describe('useUserLibrary', () => {
  it('persists linked path to localStorage', () => {});
  it('scans directory recursively', () => {});
  it('filters non-audio files', () => {});
  it('sorts directories before files', () => {});
});
```

### Playwright Verification

See features.json for verification steps. Key scenarios:

1. Panel exclusivity - open one, other closes
2. Directory linking flow
3. Preview playback
4. Insert on double-click
5. Search filtering

## Implementation Order

1. `p6-sample-panel-base` - Shared component extraction
2. `p6-user-library-button` - Header integration
3. `p6-user-library-panel` - Basic panel with tree
4. `p6-panel-exclusivity` - Mutual exclusion logic
5. `p6-user-library-link` - Directory picker
6. `p6-user-library-preview` - Audio playback
7. `p6-user-library-insert` - Editor integration
8. `p6-user-library-search` - Search functionality

## Future Enhancements (Out of Scope)

- Drag and drop samples into editor
- Sample waveform visualization
- Favorite/recent samples
- Sample metadata display (duration, format, sample rate)
- Multiple linked directories
- Sample bank creation from user files
