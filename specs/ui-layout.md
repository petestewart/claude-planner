# UI Layout

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-20

## 1. Overview

### Purpose
Define the main application layout: a split-pane interface with file browser/editor on the left and chat interface on the right.

### Goals
- Intuitive two-panel layout familiar to developers
- Resizable panes for user preference
- Responsive to window size changes
- Clear visual hierarchy

### Non-Goals
- Multiple window support
- Detachable panels
- Customizable panel positions (left/right swap)

## 2. Layout Architecture

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌─ Toolbar ───────────────────────────────────────────────────────────┐ │
│  │ [New Project] [Open] [Settings]                    [Project Name ▼] │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│  ┌─ Left Panel ─────────────────────┬─ Right Panel ────────────────────┐ │
│  │ ┌─ File Browser ───────────────┐ │ ┌─ Chat Header ────────────────┐ │ │
│  │ │ 📁 my-project                │ │ │ Spec Planner          [Mode] │ │ │
│  │ │ ├── 📄 CLAUDE.md             │ │ └──────────────────────────────┘ │ │
│  │ │ ├── 📄 PLAN.md               │ │ ┌─ Message List ───────────────┐ │ │
│  │ │ ├── 📁 specs                 │ │ │                              │ │ │
│  │ │ │   ├── 📄 README.md         │ │ │ 🤖 Let's design your app...  │ │ │
│  │ │ │   └── 📄 feature.md        │ │ │                              │ │ │
│  │ │ └── 📄 prompt.md             │ │ │ 👤 I want to build a...      │ │ │
│  │ └──────────────────────────────┘ │ │                              │ │ │
│  │ ┌─ Divider ────────────────────┐ │ │ 🤖 Great! Let me ask...      │ │ │
│  │ └──────────────────────────────┘ │ │                              │ │ │
│  │ ┌─ Editor ─────────────────────┐ │ │                              │ │ │
│  │ │ ┌─ Tab Bar ────────────────┐ │ │ │                              │ │ │
│  │ │ │ CLAUDE.md  ×             │ │ │ │                              │ │ │
│  │ │ └──────────────────────────┘ │ │ └──────────────────────────────┘ │ │
│  │ │ ┌─ Mode Toggle ────────────┐ │ │ ┌─ Input Area ─────────────────┐ │ │
│  │ │ │ [WYSIWYG] [Markdown]     │ │ │ │ Type a message...            │ │ │
│  │ │ └──────────────────────────┘ │ │ │                              │ │ │
│  │ │                              │ │ │                     [Send ➤] │ │ │
│  │ │ # Project Guidelines         │ │ └──────────────────────────────┘ │ │
│  │ │                              │ │                                  │ │
│  │ │ This project uses...         │ │                                  │ │
│  │ │                              │ │                                  │ │
│  │ └──────────────────────────────┘ │                                  │ │
│  └──────────────────────────────────┴──────────────────────────────────┘ │
│  ┌─ Status Bar ────────────────────────────────────────────────────────┐ │
│  │ ● Connected to Claude    │ Auto-commit: ON    │ Line 12, Col 5      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── Toolbar
│   ├── ProjectActions (New, Open)
│   ├── SettingsButton
│   └── ProjectSelector
├── MainLayout
│   ├── LeftPanel (resizable)
│   │   ├── FileBrowser
│   │   ├── PanelDivider (draggable)
│   │   └── EditorPanel
│   │       ├── TabBar
│   │       ├── ModeToggle
│   │       └── MarkdownEditor
│   ├── PanelResizer (vertical, draggable)
│   └── RightPanel
│       └── ChatInterface
│           ├── ChatHeader
│           ├── MessageList
│           └── InputArea
└── StatusBar
    ├── ConnectionStatus
    ├── GitStatus
    └── EditorPosition
```

## 3. Core Types

### 3.1 Layout State

```typescript
/**
 * Persisted layout preferences
 */
interface LayoutState {
  /** Width of left panel in pixels */
  leftPanelWidth: number

  /** Height of file browser as percentage of left panel (0-100) */
  fileBrowserHeight: number

  /** Minimum panel widths */
  minLeftPanelWidth: number
  minRightPanelWidth: number

  /** Whether panels are collapsed */
  leftPanelCollapsed: boolean
}

const DEFAULT_LAYOUT: LayoutState = {
  leftPanelWidth: 500,
  fileBrowserHeight: 40,
  minLeftPanelWidth: 300,
  minRightPanelWidth: 400,
  leftPanelCollapsed: false,
}
```

### 3.2 Panel Props

```typescript
interface LeftPanelProps {
  width: number
  fileBrowserHeight: number
  onFileBrowserHeightChange: (height: number) => void
}

interface RightPanelProps {
  // Chat interface handles its own state
}

interface PanelResizerProps {
  onResize: (deltaX: number) => void
  onResizeEnd: () => void
}
```

## 4. Components

### 4.1 MainLayout

```typescript
/**
 * Main application layout with resizable split panes
 */
interface MainLayoutProps {
  children?: never // No children, manages its own content
}

// Implementation notes:
// - Uses CSS Grid for main structure
// - Horizontal resizer between left and right panels
// - Persists layout to localStorage on resize end
// - Restores layout on mount
```

### 4.2 Toolbar

```typescript
interface ToolbarProps {
  projectName: string | null
  onNewProject: () => void
  onOpenProject: () => void
  onSettings: () => void
  onProjectSelect: (projectId: string) => void
  recentProjects: ProjectInfo[]
}

interface ProjectInfo {
  id: string
  name: string
  path: string
  lastOpened: string
}
```

### 4.3 StatusBar

```typescript
interface StatusBarProps {
  claudeStatus: 'connected' | 'disconnected' | 'error'
  gitEnabled: boolean
  autoCommitEnabled: boolean
  cursorPosition: { line: number; column: number } | null
  currentFile: string | null
}
```

## 5. Responsive Behavior

### Window Size Breakpoints

| Window Width | Behavior |
|--------------|----------|
| < 800px | Collapse to single panel with tab navigation |
| 800-1200px | Both panels visible, limited resize range |
| > 1200px | Full resize freedom |

### Panel Collapse

```typescript
// When left panel width < minLeftPanelWidth - 50px during drag:
// - Snap to collapsed state
// - Show expand button
// - Right panel takes full width

// When collapsed and user drags expand button:
// - Restore to minLeftPanelWidth
// - Resume normal resize behavior
```

## 6. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Toggle left panel |
| `Cmd/Ctrl + J` | Focus chat input |
| `Cmd/Ctrl + E` | Focus editor |
| `Cmd/Ctrl + P` | Quick file open |
| `Cmd/Ctrl + S` | Save current file |
| `Cmd/Ctrl + Shift + M` | Toggle editor mode (WYSIWYG/Markdown) |

## 7. Styling

### CSS Variables

```css
:root {
  /* Layout */
  --toolbar-height: 48px;
  --status-bar-height: 24px;
  --panel-divider-width: 4px;

  /* Colors - Light Mode */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e8e8e8;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #d1d1d1;
  --accent-color: #0066cc;
  --accent-hover: #0052a3;

  /* Colors - Dark Mode */
  --bg-primary-dark: #1e1e1e;
  --bg-secondary-dark: #252526;
  --bg-tertiary-dark: #2d2d2d;
  --text-primary-dark: #cccccc;
  --text-secondary-dark: #808080;
  --border-color-dark: #404040;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;

  /* Shadows */
  --shadow-panel: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.15);
}
```

### Component Styles

```css
/* Main layout grid */
.main-layout {
  display: grid;
  grid-template-columns: var(--left-panel-width) var(--panel-divider-width) 1fr;
  grid-template-rows: 1fr;
  height: calc(100vh - var(--toolbar-height) - var(--status-bar-height));
}

/* Panel resizer */
.panel-resizer {
  cursor: col-resize;
  background: var(--border-color);
  transition: background var(--transition-fast);
}

.panel-resizer:hover,
.panel-resizer:active {
  background: var(--accent-color);
}

/* Left panel internal split */
.left-panel {
  display: flex;
  flex-direction: column;
}

.file-browser {
  flex: 0 0 var(--file-browser-height);
  overflow: hidden;
}

.horizontal-divider {
  height: var(--panel-divider-width);
  cursor: row-resize;
}

.editor-panel {
  flex: 1;
  overflow: hidden;
}
```

## 8. State Management

### Layout Store (Zustand)

```typescript
interface LayoutStore extends LayoutState {
  // Actions
  setLeftPanelWidth: (width: number) => void
  setFileBrowserHeight: (height: number) => void
  toggleLeftPanel: () => void
  resetLayout: () => void
}

const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      ...DEFAULT_LAYOUT,

      setLeftPanelWidth: (width) =>
        set({ leftPanelWidth: Math.max(width, DEFAULT_LAYOUT.minLeftPanelWidth) }),

      setFileBrowserHeight: (height) =>
        set({ fileBrowserHeight: Math.min(Math.max(height, 20), 80) }),

      toggleLeftPanel: () =>
        set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),

      resetLayout: () => set(DEFAULT_LAYOUT),
    }),
    { name: 'spec-planner-layout' }
  )
)
```

## 9. Implementation Phases

### Phase 1: Shell Layout
**Goal:** Basic app shell with fixed panels
- [ ] Create App component with Toolbar, MainLayout, StatusBar
- [ ] Implement fixed-width left/right panels
- [ ] Add placeholder content to each panel
- [ ] Set up CSS variables and base styles

### Phase 2: Resizable Panels
**Goal:** Draggable panel dividers
- [ ] Implement PanelResizer component
- [ ] Add mouse event handlers for drag
- [ ] Constrain resize to min/max widths
- [ ] Add horizontal divider in left panel
- [ ] Implement FileBrowser/Editor height adjustment

### Phase 3: Layout Persistence
**Goal:** Remember user preferences
- [ ] Create LayoutStore with Zustand
- [ ] Persist to localStorage
- [ ] Restore on app mount
- [ ] Handle window resize events

### Phase 4: Responsive Behavior
**Goal:** Handle small windows
- [ ] Implement collapse behavior
- [ ] Add expand button for collapsed panel
- [ ] Handle breakpoints
- [ ] Test on various window sizes

### Phase 5: Keyboard Shortcuts
**Goal:** Keyboard navigation
- [ ] Set up global shortcut listener
- [ ] Implement panel toggle shortcut
- [ ] Implement focus shortcuts
- [ ] Add shortcut hints to UI
