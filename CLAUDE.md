# Spec Planner - Agent Guidelines

## Overview

Spec Planner is an Electron application that helps users design specifications and implementation plans for new software projects. It uses Claude Code CLI to guide users through requirements gathering and generates comprehensive documentation following the spec-driven development methodology.

## Specifications

**IMPORTANT:** Before implementing any feature, consult `specs/README.md`.

- **Assume NOT implemented.** Specs describe planned features that may not exist.
- **Check the codebase first.** Specs describe intent; code describes reality.
- **Use specs as guidance.** Follow the patterns and types defined in specs.

## Commands

### Build
- **Install:** `npm install`
- **Build:** `npm run build`
- **Dev:** `npm run dev`
- **Test:** `npm test`
- **Lint:** `npm run lint`
- **Type Check:** `npm run typecheck`

### Electron
- **Start App:** `npm start`
- **Package (macOS):** `npm run package:mac`
- **Package (Windows):** `npm run package:win`
- **Package (Linux):** `npm run package:linux`

## Architecture

### Tech Stack
- **Runtime:** Electron 28+
- **Language:** TypeScript 5+
- **Frontend:** React 18+ with CSS Modules
- **State Management:** Zustand (lightweight, modular)
- **Markdown Editor:** Milkdown or TipTap (WYSIWYG capable)
- **IPC:** Electron contextBridge for secure main/renderer communication

### Directory Structure
```
src/
├── main/                    # Electron main process
│   ├── index.ts            # App entry point
│   ├── ipc/                # IPC handlers
│   ├── services/           # Main process services
│   │   ├── claude/         # Claude CLI integration
│   │   ├── git/            # Git operations (extractable)
│   │   └── files/          # File system operations
│   └── windows/            # Window management
├── renderer/               # Electron renderer process
│   ├── index.tsx          # React entry point
│   ├── components/        # React components
│   │   ├── layout/        # App layout components
│   │   ├── file-browser/  # File browser module
│   │   ├── editor/        # Markdown editor module
│   │   └── chat/          # Chat interface module
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand stores
│   └── styles/            # Global styles
├── shared/                 # Shared between main/renderer
│   ├── types/             # TypeScript types
│   ├── constants/         # Shared constants
│   └── utils/             # Utility functions
└── templates/             # Built-in spec templates
```

### Module Boundaries

This application is designed to be extractable as part of a larger orchestration suite. Each major feature is encapsulated:

- **Claude Integration** (`src/main/services/claude/`) - Can be extracted as standalone module
- **Git Integration** (`src/main/services/git/`) - Fully decoupled, configurable
- **File Browser** (`src/renderer/components/file-browser/`) - Self-contained component
- **Markdown Editor** (`src/renderer/components/editor/`) - Independent module
- **Chat Interface** (`src/renderer/components/chat/`) - Standalone component

## Code Style

### Formatting
- **Prettier** for code formatting
- **ESLint** with TypeScript rules
- 2-space indentation, single quotes, no semicolons

### TypeScript
- Strict mode enabled
- Explicit return types on exported functions
- Use `type` for object shapes, `interface` for extendable contracts
- Prefer `unknown` over `any`

### React
- Functional components only
- Custom hooks for shared logic
- Props interfaces named `{Component}Props`
- Colocate component styles with components

### Errors
- Use custom error classes extending `Error`
- Include error codes for programmatic handling
- Log errors with context (file, operation, user action)

### Naming
- **Files:** kebab-case (`file-browser.tsx`)
- **Components:** PascalCase (`FileBrowser`)
- **Functions:** camelCase (`handleFileSelect`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types:** PascalCase (`FileNode`, `EditorState`)

### Testing
- Jest for unit tests
- React Testing Library for component tests
- Test files colocated: `component.test.tsx`
- Mock IPC calls in renderer tests

## Common Patterns

### IPC Communication
```typescript
// Main process - register handler
ipcMain.handle('file:read', async (event, path: string) => {
  return fileService.read(path)
})

// Renderer - call via preload
const content = await window.api.file.read(path)
```

### State Management
```typescript
// Zustand store pattern
const useFileStore = create<FileState>((set, get) => ({
  files: [],
  selectedFile: null,
  selectFile: (file) => set({ selectedFile: file }),
}))
```

### Service Extraction Pattern
```typescript
// Services should export a factory function for future extraction
export function createGitService(options: GitServiceOptions): GitService {
  return new GitServiceImpl(options)
}
```

## Environment Variables

- `CLAUDE_CLI_PATH` - Path to Claude Code CLI (defaults to `claude`)
- `DEFAULT_TEMPLATE` - Default template name (defaults to `standard`)
- `GIT_AUTO_COMMIT` - Enable auto-commit (defaults to `false`)
