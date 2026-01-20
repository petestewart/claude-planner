# Markdown Editor

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-20

## 1. Overview

### Purpose
Provide a rich-text markdown editor with WYSIWYG capabilities and a toggle to raw markdown mode, similar to Typora. Users can view and edit spec files with a clean, distraction-free interface.

### Goals
- WYSIWYG editing that feels like a word processor
- Toggle to raw markdown for power users
- Real-time preview of formatting
- Syntax highlighting in code blocks
- Support for tables, checklists, and diagrams
- Handle external file changes (from agent)

### Non-Goals
- Collaborative editing
- Version history within editor (use git)
- Export to formats other than markdown
- Custom markdown extensions

## 2. Architecture

### Component Structure

```
src/renderer/components/editor/
├── index.ts                    # Public exports
├── MarkdownEditor.tsx         # Main editor container
├── EditorToolbar.tsx          # Formatting toolbar
├── ModeToggle.tsx             # WYSIWYG/Markdown switch
├── WysiwygEditor.tsx          # Rich text editor (Milkdown)
├── MarkdownEditor.tsx         # Raw markdown (CodeMirror)
├── TabBar.tsx                 # Open file tabs
├── editor.module.css          # Styles
└── hooks/
    ├── useEditor.ts           # Editor state management
    ├── useFileSync.ts         # Sync with file system
    └── useAutoSave.ts         # Auto-save functionality
```

### Library Choice: Milkdown

Milkdown is chosen for WYSIWYG editing because:
- Built on ProseMirror (battle-tested)
- Plugin architecture for extensibility
- Native markdown support (no conversion layer)
- Good TypeScript support
- Active maintenance

CodeMirror 6 for raw markdown mode:
- Industry standard code editor
- Excellent performance
- Markdown syntax highlighting
- Vim mode available (optional)

### Data Flow

```
┌─────────────────┐
│  File Browser   │ ── onSelect(path)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EditorStore    │ ── manages open files, content, dirty state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│MarkdownEditor   │ ── container, mode switching
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│WYSIWYG │ │   Raw    │
│  Mode  │ │   Mode   │
└────────┘ └──────────┘
```

## 3. Core Types

### 3.1 Editor State

```typescript
/**
 * State for a single open file
 */
interface OpenFile {
  /** Absolute file path */
  path: string

  /** File name (for tab display) */
  name: string

  /** Current content in editor */
  content: string

  /** Content as last saved to disk */
  savedContent: string

  /** Whether content differs from saved */
  isDirty: boolean

  /** Last modification time from disk */
  diskModifiedAt: string | null

  /** Cursor/selection position */
  selection: EditorSelection

  /** Scroll position */
  scrollPosition: number
}

interface EditorSelection {
  /** Selection anchor position */
  anchor: number

  /** Selection head position */
  head: number
}

/**
 * Editor store state
 */
interface EditorStore {
  /** Currently active file path */
  activeFile: string | null

  /** Map of open files by path */
  openFiles: Map<string, OpenFile>

  /** Current editing mode */
  mode: 'wysiwyg' | 'markdown'

  /** Auto-save enabled */
  autoSaveEnabled: boolean

  /** Auto-save delay in ms */
  autoSaveDelay: number

  // Actions
  openFile: (path: string) => Promise<void>
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  updateContent: (path: string, content: string) => void
  saveFile: (path: string) => Promise<void>
  saveAllFiles: () => Promise<void>
  setMode: (mode: 'wysiwyg' | 'markdown') => void
  reloadFromDisk: (path: string) => Promise<void>
  setSelection: (path: string, selection: EditorSelection) => void
}
```

### 3.2 Conflict Resolution

```typescript
/**
 * When external changes are detected
 */
interface FileConflict {
  path: string
  editorContent: string
  diskContent: string
  diskModifiedAt: string
}

type ConflictResolution = 'keep-editor' | 'load-disk' | 'merge'
```

## 4. Components

### 4.1 MarkdownEditor (Container)

```typescript
interface MarkdownEditorProps {
  /** Height constraint from layout */
  height: number | string
}

/**
 * Main container that:
 * - Renders TabBar for open files
 * - Renders ModeToggle
 * - Switches between WYSIWYG and raw editors
 * - Handles keyboard shortcuts
 * - Manages conflict dialogs
 */
```

### 4.2 TabBar

```typescript
interface TabBarProps {
  /** Open files to show as tabs */
  files: OpenFile[]

  /** Currently active file path */
  activePath: string | null

  /** Tab click handler */
  onTabClick: (path: string) => void

  /** Tab close handler */
  onTabClose: (path: string) => void
}

/**
 * Features:
 * - Show file name
 * - Dirty indicator (dot)
 * - Close button
 * - Drag to reorder (future)
 */
```

### 4.3 ModeToggle

```typescript
interface ModeToggleProps {
  mode: 'wysiwyg' | 'markdown'
  onChange: (mode: 'wysiwyg' | 'markdown') => void
}

/**
 * Toggle button group:
 * [WYSIWYG] [Markdown]
 *
 * Keyboard shortcut: Cmd+Shift+M
 */
```

### 4.4 WysiwygEditor

```typescript
interface WysiwygEditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selection: EditorSelection) => void
}

/**
 * Milkdown-based editor with:
 * - Headings (H1-H6)
 * - Bold, italic, strikethrough
 * - Links
 * - Images
 * - Code blocks with syntax highlighting
 * - Blockquotes
 * - Lists (ordered, unordered)
 * - Task lists (checkboxes)
 * - Tables
 * - Horizontal rules
 */
```

### 4.5 RawMarkdownEditor

```typescript
interface RawMarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selection: EditorSelection) => void
}

/**
 * CodeMirror 6 editor with:
 * - Markdown syntax highlighting
 * - Line numbers
 * - Code folding
 * - Search/replace
 * - Bracket matching
 */
```

### 4.6 EditorToolbar

```typescript
interface EditorToolbarProps {
  /** Called when format action is triggered */
  onFormat: (action: FormatAction) => void

  /** Current selection state for toggle buttons */
  selectionState: SelectionState
}

type FormatAction =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'strikethrough' }
  | { type: 'code' }
  | { type: 'link' }
  | { type: 'image' }
  | { type: 'blockquote' }
  | { type: 'bullet-list' }
  | { type: 'ordered-list' }
  | { type: 'task-list' }
  | { type: 'code-block' }
  | { type: 'table' }
  | { type: 'horizontal-rule' }

interface SelectionState {
  isBold: boolean
  isItalic: boolean
  isStrikethrough: boolean
  isCode: boolean
  headingLevel: number | null
  isBlockquote: boolean
  listType: 'bullet' | 'ordered' | 'task' | null
}
```

## 5. Editor Features

### 5.1 Supported Markdown Elements

| Element | WYSIWYG Support | Keyboard Shortcut |
|---------|-----------------|-------------------|
| Heading 1-6 | ✅ | Cmd+1 through Cmd+6 |
| Bold | ✅ | Cmd+B |
| Italic | ✅ | Cmd+I |
| Strikethrough | ✅ | Cmd+Shift+S |
| Inline code | ✅ | Cmd+E |
| Link | ✅ | Cmd+K |
| Image | ✅ | Cmd+Shift+I |
| Blockquote | ✅ | Cmd+Shift+. |
| Bullet list | ✅ | Cmd+Shift+8 |
| Numbered list | ✅ | Cmd+Shift+7 |
| Task list | ✅ | Cmd+Shift+9 |
| Code block | ✅ | Cmd+Shift+C |
| Table | ✅ | (toolbar only) |
| Horizontal rule | ✅ | Cmd+Shift+- |

### 5.2 Code Block Languages

Syntax highlighting for:
- typescript, javascript
- rust, go, python, java
- json, yaml, toml
- sql
- bash, shell
- markdown
- html, css

### 5.3 Table Editing

In WYSIWYG mode:
- Click to add rows/columns
- Tab to navigate cells
- Shift+Tab to go back
- Context menu for row/column operations

## 6. File Synchronization

### 6.1 Auto-Save Hook

```typescript
function useAutoSave(path: string | null, content: string, enabled: boolean, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef(content)

  useEffect(() => {
    if (!enabled || !path || content === lastSavedRef.current) return

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Schedule save
    timeoutRef.current = setTimeout(async () => {
      await window.api.file.write(path, content)
      lastSavedRef.current = content
      useEditorStore.getState().markSaved(path)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [path, content, enabled, delay])
}
```

### 6.2 External Change Detection

```typescript
function useFileSync(path: string | null) {
  useEffect(() => {
    if (!path) return

    const unsubscribe = window.api.file.onWatchEvent((event) => {
      if (event.path !== path || event.type !== 'change') return

      const store = useEditorStore.getState()
      const openFile = store.openFiles.get(path)

      if (!openFile) return

      // File changed externally
      if (openFile.isDirty) {
        // User has unsaved changes - show conflict dialog
        store.showConflictDialog({
          path,
          editorContent: openFile.content,
          diskContent: event.content,
          diskModifiedAt: event.timestamp,
        })
      } else {
        // No local changes - auto-reload
        store.reloadFromDisk(path)
      }
    })

    return unsubscribe
  }, [path])
}
```

### 6.3 Conflict Dialog

```typescript
interface ConflictDialogProps {
  conflict: FileConflict
  onResolve: (resolution: ConflictResolution) => void
}

/**
 * Dialog shown when external changes conflict with local changes
 *
 * Options:
 * - "Keep my changes" - ignore disk version
 * - "Load from disk" - discard local changes
 * - "View diff" - show side-by-side comparison (future)
 */
```

## 7. Styling

### 7.1 Editor Chrome

```css
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.tab-bar {
  display: flex;
  align-items: center;
  height: 36px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.tab {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  font-size: 13px;
  cursor: pointer;
  border-right: 1px solid var(--border-color);
}

.tab--active {
  background: var(--bg-primary);
  border-bottom: 2px solid var(--accent-color);
}

.tab__dirty-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
  margin-left: 8px;
}

.mode-toggle {
  display: flex;
  padding: 4px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  margin: 8px;
}

.mode-toggle__button {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.mode-toggle__button--active {
  background: var(--bg-primary);
  box-shadow: var(--shadow-panel);
}
```

### 7.2 WYSIWYG Typography

```css
.wysiwyg-editor {
  padding: 24px 32px;
  max-width: 800px;
  margin: 0 auto;
  font-family: var(--font-prose);
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
}

.wysiwyg-editor h1 {
  font-size: 2em;
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.wysiwyg-editor h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.wysiwyg-editor p {
  margin: 1em 0;
}

.wysiwyg-editor code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
}

.wysiwyg-editor pre {
  background: var(--bg-tertiary);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.wysiwyg-editor pre code {
  background: none;
  padding: 0;
}

.wysiwyg-editor blockquote {
  border-left: 4px solid var(--accent-color);
  padding-left: 16px;
  margin-left: 0;
  color: var(--text-secondary);
}

.wysiwyg-editor table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.wysiwyg-editor th,
.wysiwyg-editor td {
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  text-align: left;
}

.wysiwyg-editor th {
  background: var(--bg-secondary);
  font-weight: 600;
}
```

## 8. Error Handling

```typescript
/**
 * Editor-specific errors
 */
class EditorError extends Error {
  constructor(
    message: string,
    public code: 'LOAD_FAILED' | 'SAVE_FAILED' | 'PARSE_ERROR',
    public path?: string
  ) {
    super(message)
    this.name = 'EditorError'
  }
}

// Error states in UI:
// - Load failed: Show error message with retry button
// - Save failed: Show toast with retry, keep content in editor
// - Parse error: Fall back to raw markdown mode
```

## 9. Implementation Phases

### Phase 1: Basic Editor Shell
**Goal:** Editor container with mode toggle
- [ ] Create MarkdownEditor container
- [ ] Implement ModeToggle component
- [ ] Add TabBar component (single file)
- [ ] Set up EditorStore with Zustand
- [ ] Basic styling

### Phase 2: Raw Markdown Mode
**Goal:** CodeMirror integration
- [ ] Install and configure CodeMirror 6
- [ ] Set up markdown syntax highlighting
- [ ] Implement line numbers
- [ ] Connect to store (content, selection)
- [ ] Test with file loading

### Phase 3: WYSIWYG Mode
**Goal:** Milkdown integration
- [ ] Install and configure Milkdown
- [ ] Enable core plugins (headings, lists, etc.)
- [ ] Enable code block syntax highlighting
- [ ] Enable table support
- [ ] Connect to store

### Phase 4: Mode Switching
**Goal:** Seamless toggle between modes
- [ ] Implement content conversion on switch
- [ ] Preserve cursor position when possible
- [ ] Handle edge cases (complex tables, etc.)
- [ ] Add keyboard shortcut

### Phase 5: File Operations
**Goal:** Load and save files
- [ ] Connect to file IPC
- [ ] Implement file loading
- [ ] Implement file saving
- [ ] Add dirty state tracking
- [ ] Add unsaved changes warning on close

### Phase 6: Auto-Save & Sync
**Goal:** Automatic saving and external change handling
- [ ] Implement useAutoSave hook
- [ ] Implement useFileSync hook
- [ ] Create conflict dialog
- [ ] Test with agent file modifications

### Phase 7: Toolbar
**Goal:** Formatting toolbar for WYSIWYG
- [ ] Create EditorToolbar component
- [ ] Implement all format actions
- [ ] Add selection state tracking
- [ ] Style toolbar

### Phase 8: Polish
**Goal:** Production ready
- [ ] Add loading states
- [ ] Add error handling
- [ ] Optimize performance
- [ ] Test keyboard shortcuts
- [ ] Accessibility audit
