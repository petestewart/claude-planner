# File Browser

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-20

## 1. Overview

### Purpose
Provide a tree-view file browser for navigating the project directory, selecting files to view/edit, and observing real-time file changes from agent activity.

### Goals
- Display project directory as expandable tree
- Support file selection to open in editor
- Show real-time updates when files change
- Indicate file status (new, modified, generated)
- Support basic file operations (create, rename, delete)

### Non-Goals
- Drag-and-drop file moving
- Multi-select operations
- File search within browser (use Cmd+P for quick open)
- Show files outside project directory

## 2. Architecture

### Component Structure

```
src/renderer/components/file-browser/
├── index.ts                    # Public exports
├── FileBrowser.tsx            # Main container component
├── FileTree.tsx               # Recursive tree renderer
├── FileTreeNode.tsx           # Single node (file/folder)
├── FileIcon.tsx               # Icon by file type
├── FileBrowserToolbar.tsx     # Refresh, collapse all, new file
├── ContextMenu.tsx            # Right-click menu
├── file-browser.module.css    # Styles
└── hooks/
    ├── useFileTree.ts         # Tree data management
    └── useFileWatcher.ts      # Real-time updates
```

### Data Flow

```
┌─────────────────┐
│  Main Process   │
│  FileService    │
└────────┬────────┘
         │ IPC: file:list, file:watch:event
         ▼
┌─────────────────┐
│   FileStore     │ ── Zustand store for file tree state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FileBrowser    │ ── Container, handles selection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FileTree      │ ── Recursive rendering
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FileTreeNode    │ ── Individual file/folder
└─────────────────┘
```

## 3. Core Types

### 3.1 File Tree Types

```typescript
/**
 * A node in the file tree (file or directory)
 */
interface FileNode {
  /** Unique identifier (absolute path) */
  id: string

  /** File or directory name */
  name: string

  /** Absolute path */
  path: string

  /** Node type */
  type: 'file' | 'directory'

  /** File extension without dot (e.g., "md", "ts") */
  extension?: string

  /** Children nodes (directories only) */
  children?: FileNode[]

  /** UI state: expanded in tree view */
  expanded?: boolean

  /** Depth level in tree (0 = root) */
  depth: number
}

/**
 * File status indicators for visual feedback
 */
type FileStatus =
  | 'normal'      // No special status
  | 'new'         // Recently created
  | 'modified'    // Changed since last view
  | 'generating'  // Agent is currently writing
  | 'error'       // Read/write error occurred

/**
 * Extended node with status for rendering
 */
interface FileNodeWithStatus extends FileNode {
  status: FileStatus
  lastModified?: string
}
```

### 3.2 Store Types

```typescript
interface FileStore {
  /** Root path of current project */
  rootPath: string | null

  /** Tree structure */
  tree: FileNode | null

  /** Currently selected file path */
  selectedPath: string | null

  /** Set of expanded directory paths */
  expandedPaths: Set<string>

  /** Map of path -> status */
  fileStatuses: Map<string, FileStatus>

  /** Loading state */
  isLoading: boolean

  /** Error state */
  error: string | null

  // Actions
  setRootPath: (path: string) => Promise<void>
  refreshTree: () => Promise<void>
  selectFile: (path: string) => void
  toggleExpanded: (path: string) => void
  expandPath: (path: string) => void
  collapseAll: () => void
  setFileStatus: (path: string, status: FileStatus) => void
  clearFileStatus: (path: string) => void
}
```

### 3.3 Event Types

```typescript
/**
 * File watcher events from main process
 */
interface FileWatchEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  timestamp: string
}

/**
 * Context menu action
 */
interface ContextMenuAction {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  handler: (node: FileNode) => void
}
```

## 4. Components

### 4.1 FileBrowser

```typescript
interface FileBrowserProps {
  /** Height constraint (controlled by parent) */
  height: number | string
}

/**
 * Main container component
 * - Manages file selection
 * - Handles keyboard navigation
 * - Coordinates with editor
 */
```

### 4.2 FileTree

```typescript
interface FileTreeProps {
  /** Root node to render */
  root: FileNode

  /** Currently selected path */
  selectedPath: string | null

  /** Set of expanded directory paths */
  expandedPaths: Set<string>

  /** File status map */
  fileStatuses: Map<string, FileStatus>

  /** Selection handler */
  onSelect: (path: string) => void

  /** Expand/collapse handler */
  onToggle: (path: string) => void

  /** Context menu handler */
  onContextMenu: (event: React.MouseEvent, node: FileNode) => void
}
```

### 4.3 FileTreeNode

```typescript
interface FileTreeNodeProps {
  node: FileNode
  isSelected: boolean
  isExpanded: boolean
  status: FileStatus
  onSelect: () => void
  onToggle: () => void
  onContextMenu: (event: React.MouseEvent) => void
  onDoubleClick: () => void
}

/**
 * Visual states:
 * - Default: normal text color
 * - Selected: highlighted background
 * - Hover: subtle background
 * - New: green indicator dot
 * - Modified: orange indicator dot
 * - Generating: pulsing animation
 * - Error: red indicator
 */
```

### 4.4 FileIcon

```typescript
interface FileIconProps {
  type: 'file' | 'directory'
  extension?: string
  expanded?: boolean
}

/**
 * Icon mapping by extension:
 * - .md: document icon
 * - .ts/.tsx: TypeScript icon
 * - .json: JSON icon
 * - .css: style icon
 * - directory: folder icon (open/closed)
 * - default: generic file icon
 */
```

### 4.5 FileBrowserToolbar

```typescript
interface FileBrowserToolbarProps {
  onRefresh: () => void
  onCollapseAll: () => void
  onNewFile: () => void
  onNewFolder: () => void
  isLoading: boolean
}
```

## 5. File Operations

### 5.1 IPC Handlers (Main Process)

```typescript
// file:list - Get directory contents
ipcMain.handle('file:list', async (event, dirPath: string): Promise<FileNode> => {
  // Returns nested FileNode structure
  // Filters out hidden files (starting with .)
  // Filters out node_modules, .git by default
})

// file:watch:start - Begin watching directory
ipcMain.handle('file:watch:start', async (event, dirPath: string): Promise<void> => {
  // Uses chokidar for cross-platform watching
  // Emits file:watch:event on changes
})

// file:watch:stop - Stop watching
ipcMain.handle('file:watch:stop', async (event, dirPath: string): Promise<void> => {
  // Cleanup watcher
})

// file:create - Create new file
ipcMain.handle('file:create', async (event, filePath: string, content?: string): Promise<void> => {
  // Creates file with optional initial content
})

// file:rename - Rename file or directory
ipcMain.handle('file:rename', async (event, oldPath: string, newPath: string): Promise<void> => {
  // Renames, handles conflicts
})

// file:delete - Delete file or directory
ipcMain.handle('file:delete', async (event, filePath: string): Promise<void> => {
  // Moves to trash (not permanent delete)
})
```

### 5.2 Filtered Patterns

```typescript
/**
 * Patterns to exclude from file tree
 */
const EXCLUDED_PATTERNS = [
  'node_modules',
  '.git',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '.env*',
  'dist',
  'build',
  '.next',
]
```

## 6. User Interactions

### 6.1 Mouse Interactions

| Action | Behavior |
|--------|----------|
| Single click file | Select file, open in editor |
| Single click folder | Toggle expand/collapse |
| Double click file | Open file and focus editor |
| Right click | Show context menu |

### 6.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move selection |
| `←` | Collapse folder / Go to parent |
| `→` | Expand folder / Enter folder |
| `Enter` | Open selected file in editor |
| `Space` | Toggle folder expand |
| `Delete` | Delete selected (with confirmation) |
| `F2` | Rename selected |

### 6.3 Context Menu

```typescript
const FILE_CONTEXT_ACTIONS: ContextMenuAction[] = [
  { id: 'open', label: 'Open', handler: openInEditor },
  { id: 'rename', label: 'Rename', shortcut: 'F2', handler: startRename },
  { id: 'delete', label: 'Delete', danger: true, handler: deleteWithConfirm },
  { id: 'separator', label: '-' },
  { id: 'copyPath', label: 'Copy Path', handler: copyPathToClipboard },
  { id: 'revealInFinder', label: 'Reveal in Finder', handler: revealInOS },
]

const FOLDER_CONTEXT_ACTIONS: ContextMenuAction[] = [
  { id: 'newFile', label: 'New File', handler: createFileInFolder },
  { id: 'newFolder', label: 'New Folder', handler: createFolderInFolder },
  { id: 'separator', label: '-' },
  { id: 'rename', label: 'Rename', shortcut: 'F2', handler: startRename },
  { id: 'delete', label: 'Delete', danger: true, handler: deleteWithConfirm },
  { id: 'separator', label: '-' },
  { id: 'copyPath', label: 'Copy Path', handler: copyPathToClipboard },
  { id: 'revealInFinder', label: 'Reveal in Finder', handler: revealInOS },
]
```

## 7. Real-time Updates

### 7.1 File Watcher Hook

```typescript
function useFileWatcher(rootPath: string | null) {
  useEffect(() => {
    if (!rootPath) return

    // Start watching
    window.api.file.watchStart(rootPath)

    // Subscribe to events
    const unsubscribe = window.api.file.onWatchEvent((event) => {
      const fileStore = useFileStore.getState()

      switch (event.type) {
        case 'add':
        case 'addDir':
          // Add node to tree, mark as 'new'
          fileStore.refreshTree()
          fileStore.setFileStatus(event.path, 'new')
          // Clear 'new' status after 3 seconds
          setTimeout(() => fileStore.clearFileStatus(event.path), 3000)
          break

        case 'change':
          // Mark as 'modified'
          fileStore.setFileStatus(event.path, 'modified')
          // Clear after 3 seconds
          setTimeout(() => fileStore.clearFileStatus(event.path), 3000)
          break

        case 'unlink':
        case 'unlinkDir':
          // Remove node from tree
          fileStore.refreshTree()
          break
      }
    })

    return () => {
      window.api.file.watchStop(rootPath)
      unsubscribe()
    }
  }, [rootPath])
}
```

### 7.2 Status Indicators

```css
/* New file indicator */
.file-node--new::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
}

/* Modified file indicator */
.file-node--modified::before {
  background: var(--color-warning);
}

/* Generating animation */
.file-node--generating {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 8. Styling

### 8.1 Tree Styles

```css
.file-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.file-node {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  padding-left: calc(8px + var(--depth) * 16px);
  cursor: pointer;
  user-select: none;
  position: relative;
}

.file-node:hover {
  background: var(--bg-hover);
}

.file-node--selected {
  background: var(--bg-selected);
}

.file-node__icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  flex-shrink: 0;
}

.file-node__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.file-node__chevron {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  transition: transform var(--transition-fast);
}

.file-node__chevron--expanded {
  transform: rotate(90deg);
}
```

## 9. Error Handling

```typescript
/**
 * File operation errors
 */
class FileOperationError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'ALREADY_EXISTS' | 'UNKNOWN',
    public path: string
  ) {
    super(message)
    this.name = 'FileOperationError'
  }
}

// Error display in UI
// - Show toast notification for transient errors
// - Show error status on file node for persistent errors
// - Allow retry for recoverable errors
```

## 10. Implementation Phases

### Phase 1: Static Tree Display
**Goal:** Render file tree from data
- [ ] Create FileNode type and mock data
- [ ] Implement FileTree recursive component
- [ ] Implement FileTreeNode component
- [ ] Add FileIcon component
- [ ] Basic styling

### Phase 2: Tree Interaction
**Goal:** User can navigate and select
- [ ] Implement expand/collapse
- [ ] Implement file selection
- [ ] Add keyboard navigation
- [ ] Connect to editor (open on select)

### Phase 3: IPC Integration
**Goal:** Load real files from disk
- [ ] Implement file:list IPC handler
- [ ] Create FileStore with Zustand
- [ ] Replace mock data with IPC calls
- [ ] Handle loading states

### Phase 4: File Watching
**Goal:** Real-time updates
- [ ] Set up chokidar in main process
- [ ] Implement file:watch:start/stop handlers
- [ ] Create useFileWatcher hook
- [ ] Add status indicators UI

### Phase 5: File Operations
**Goal:** Create, rename, delete
- [ ] Implement context menu
- [ ] Add create file/folder handlers
- [ ] Add rename inline editing
- [ ] Add delete with confirmation
- [ ] Add toolbar actions

### Phase 6: Polish
**Goal:** Production ready
- [ ] Add error handling
- [ ] Add loading skeletons
- [ ] Optimize large directory performance
- [ ] Add empty state
- [ ] Test edge cases
