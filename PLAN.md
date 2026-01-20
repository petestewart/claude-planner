# Spec Planner - Implementation Plan

## Phase 1: Project Setup

**Status:** ✅ Complete

**Spec Reference:** [specs/architecture.md](./specs/architecture.md)

### Tasks
- [x] **1.1** Initialize npm project with TypeScript configuration
- [x] **1.2** Set up Electron with main/renderer process structure
- [x] **1.3** Configure Electron Forge or electron-builder for packaging
- [x] **1.4** Set up React with Vite bundler
- [x] **1.5** Configure preload script with contextBridge
- [x] **1.6** Set up ESLint + Prettier with project rules
- [x] **1.7** Configure Jest for testing
- [x] **1.8** Create directory structure per architecture spec
- [x] **1.9** Add development scripts to package.json
- [x] **1.10** Verify hot reload works for both main and renderer

### Verification
- [x] `npm run dev` starts Electron app with React
- [x] Changes to renderer code hot reload
- [x] Changes to main code restart process
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes

---

## Phase 2: Core Layout

**Status:** ✅ Complete

**Spec Reference:** [specs/ui-layout.md](./specs/ui-layout.md)

### Tasks
- [x] **2.1** Create App component shell with CSS variables
- [x] **2.2** Implement Toolbar component (placeholder actions)
- [x] **2.3** Implement StatusBar component
- [x] **2.4** Create MainLayout with CSS Grid structure
- [x] **2.5** Implement vertical PanelResizer (left/right)
- [x] **2.6** Implement horizontal divider in left panel
- [x] **2.7** Create LayoutStore with Zustand
- [x] **2.8** Add layout persistence to localStorage
- [x] **2.9** Implement panel collapse behavior
- [x] **2.10** Add keyboard shortcuts for panel toggle

### Verification
- [x] Window renders with toolbar, main area, status bar
- [x] Left/right panels resize via drag
- [x] File browser/editor areas resize via drag
- [x] Layout persists across app restarts
- [x] `Cmd+B` toggles left panel

---

## Phase 3: File Browser

**Status:** ✅ Complete

**Spec Reference:** [specs/file-browser.md](./specs/file-browser.md)

### Tasks
- [x] **3.1** Create FileNode types and interfaces
- [x] **3.2** Implement FileTree recursive component
- [x] **3.3** Implement FileTreeNode with expand/collapse
- [x] **3.4** Add FileIcon component with extension mapping
- [x] **3.5** Create FileStore with Zustand
- [x] **3.6** Implement `file:list` IPC handler (main process)
- [x] **3.7** Connect FileTree to IPC for real data
- [x] **3.8** Implement file selection (single click)
- [x] **3.9** Add keyboard navigation (arrows, enter)
- [x] **3.10** Implement FileBrowserToolbar (refresh, collapse all)

### Verification
- [x] File tree displays project directory
- [x] Folders expand/collapse on click
- [x] Files can be selected
- [x] Keyboard navigation works
- [x] Refresh button reloads tree

---

## Phase 4: File Watching

**Status:** ✅ Complete

**Spec Reference:** [specs/file-browser.md](./specs/file-browser.md) §7

### Tasks
- [x] **4.1** Set up chokidar in main process
- [x] **4.2** Implement `file:watch:start` IPC handler
- [x] **4.3** Implement `file:watch:stop` IPC handler
- [x] **4.4** Create useFileWatcher hook in renderer
- [x] **4.5** Handle 'add' events (new file indicator)
- [x] **4.6** Handle 'change' events (modified indicator)
- [x] **4.7** Handle 'unlink' events (remove from tree)
- [x] **4.8** Add status indicator CSS (green dot, orange dot)
- [x] **4.9** Auto-clear status indicators after timeout
- [x] **4.10** Test with external file modifications

### Verification
- [x] Creating file externally adds to tree
- [x] Modifying file shows indicator
- [x] Deleting file removes from tree
- [x] Indicators clear after 3 seconds

---

## Phase 5: Markdown Editor - Basic

**Status:** ✅ Complete

**Spec Reference:** [specs/markdown-editor.md](./specs/markdown-editor.md)

### Tasks
- [x] **5.1** Create MarkdownEditor container component
- [x] **5.2** Implement TabBar for open files
- [x] **5.3** Set up CodeMirror 6 with markdown mode
- [x] **5.4** Add line numbers and basic styling
- [x] **5.5** Create EditorStore with Zustand
- [x] **5.6** Implement `file:read` IPC handler
- [x] **5.7** Connect file selection to editor opening
- [x] **5.8** Implement `file:write` IPC handler
- [x] **5.9** Add dirty state tracking
- [x] **5.10** Implement `Cmd+S` to save

### Verification
- [x] Clicking file in browser opens in editor
- [x] Markdown syntax highlighting works
- [x] Edits mark file as dirty (tab indicator)
- [x] `Cmd+S` saves file to disk
- [x] Multiple files can be open in tabs

---

## Phase 6: Markdown Editor - WYSIWYG

**Status:** ✅ Complete

**Spec Reference:** [specs/markdown-editor.md](./specs/markdown-editor.md) §4.4

### Tasks
- [x] **6.1** Install and configure Milkdown
- [x] **6.2** Enable core plugins (headings, lists, etc.)
- [x] **6.3** Enable code block syntax highlighting
- [x] **6.4** Enable table support
- [x] **6.5** Create ModeToggle component
- [x] **6.6** Implement mode switching logic
- [x] **6.7** Preserve content when switching modes
- [x] **6.8** Add `Cmd+Shift+M` shortcut for toggle
- [x] **6.9** Create EditorToolbar with format buttons
- [x] **6.10** Style WYSIWYG content (typography)

### Verification
- [x] Toggle switches between WYSIWYG and markdown
- [x] Content preserved during switch
- [x] WYSIWYG shows rich formatting
- [x] Toolbar buttons apply formatting
- [x] Code blocks have syntax highlighting

---

## Phase 7: Editor File Sync

**Status:** 🔄 In Progress

**Spec Reference:** [specs/markdown-editor.md](./specs/markdown-editor.md) §6

### Tasks
- [ ] **7.1** Implement useAutoSave hook
- [ ] **7.2** Add auto-save toggle to settings
- [ ] **7.3** Implement useFileSync hook
- [ ] **7.4** Detect external changes to open files
- [ ] **7.5** Auto-reload if no local changes
- [ ] **7.6** Create ConflictDialog component
- [ ] **7.7** Handle "keep mine" resolution
- [ ] **7.8** Handle "load from disk" resolution
- [ ] **7.9** Add unsaved changes warning on tab close
- [ ] **7.10** Test with agent file modifications

### Verification
- [ ] Auto-save works after delay
- [ ] External changes detected
- [ ] Conflict dialog appears when both changed
- [ ] Resolutions apply correctly
- [ ] Closing dirty tab warns user

---

## Phase 8: Chat Interface - Display

**Status:** ⬜ Not Started

**Spec Reference:** [specs/chat-interface.md](./specs/chat-interface.md)

### Tasks
- [ ] **8.1** Create ChatInterface container
- [ ] **8.2** Create MessageList component
- [ ] **8.3** Create ChatMessage component
- [ ] **8.4** Implement MessageContent with markdown rendering
- [ ] **8.5** Add message styling (user vs assistant)
- [ ] **8.6** Add timestamp display
- [ ] **8.7** Create ChatStore with Zustand
- [ ] **8.8** Implement auto-scroll on new messages
- [ ] **8.9** Add scroll-to-bottom button
- [ ] **8.10** Add welcome message on new session

### Verification
- [ ] Messages render with markdown formatting
- [ ] User/assistant messages styled differently
- [ ] Code blocks have syntax highlighting
- [ ] Auto-scrolls on new message
- [ ] Welcome message appears initially

---

## Phase 9: Chat Interface - Input

**Status:** ⬜ Not Started

**Spec Reference:** [specs/chat-interface.md](./specs/chat-interface.md) §4.7

### Tasks
- [ ] **9.1** Create InputArea component
- [ ] **9.2** Implement auto-resize textarea
- [ ] **9.3** Add send button
- [ ] **9.4** Handle Enter to send, Shift+Enter for newline
- [ ] **9.5** Track input history in store
- [ ] **9.6** Implement up/down arrow history navigation
- [ ] **9.7** Add Escape to clear input
- [ ] **9.8** Add `Cmd+J` global shortcut to focus
- [ ] **9.9** Disable input during generation
- [ ] **9.10** Add cancel button during generation

### Verification
- [ ] Messages can be sent
- [ ] Enter sends, Shift+Enter adds line
- [ ] Up arrow recalls previous messages
- [ ] `Cmd+J` focuses chat input
- [ ] Cancel button stops generation

---

## Phase 10: Claude Service

**Status:** ⬜ Not Started

**Spec Reference:** [specs/claude-integration.md](./specs/claude-integration.md)

### Tasks
- [ ] **10.1** Create ClaudeService types and interfaces
- [ ] **10.2** Implement ProcessManager (spawn, collect output)
- [ ] **10.3** Implement StreamParser for CLI output
- [ ] **10.4** Create ClaudeService with sendMessage
- [ ] **10.5** Handle streaming response chunks
- [ ] **10.6** Implement cancel functionality
- [ ] **10.7** Detect file changes in output
- [ ] **10.8** Register IPC handlers
- [ ] **10.9** Connect chat to Claude service
- [ ] **10.10** Test end-to-end conversation

### Verification
- [ ] Message sent to Claude CLI
- [ ] Response streams to chat
- [ ] File changes detected and displayed
- [ ] Cancel stops generation
- [ ] Errors display in chat

---

## Phase 11: Context Management

**Status:** ⬜ Not Started

**Spec Reference:** [specs/claude-integration.md](./specs/claude-integration.md) §4.4

### Tasks
- [ ] **11.1** Create ProjectContext types
- [ ] **11.2** Implement ContextBuilder
- [ ] **11.3** Create ProjectStore with Zustand
- [ ] **11.4** Track requirements from conversation
- [ ] **11.5** Track decisions from conversation
- [ ] **11.6** Include existing specs in context
- [ ] **11.7** Add generation mode to context
- [ ] **11.8** Test context size limits
- [ ] **11.9** Implement context summarization (if needed)
- [ ] **11.10** Persist project state to disk

### Verification
- [ ] Context includes project info
- [ ] Requirements tracked across messages
- [ ] Decisions persist in context
- [ ] Spec files summarized in context
- [ ] Project state saves/loads

---

## Phase 12: Template System - Core

**Status:** ⬜ Not Started

**Spec Reference:** [specs/template-system.md](./specs/template-system.md)

### Tasks
- [ ] **12.1** Create Template types and interfaces
- [ ] **12.2** Implement TemplateLoader for built-in templates
- [ ] **12.3** Bundle standard template with app
- [ ] **12.4** Set up Handlebars for rendering
- [ ] **12.5** Implement TemplateRenderer
- [ ] **12.6** Register custom Handlebars helpers
- [ ] **12.7** Create TemplateService
- [ ] **12.8** Register IPC handlers
- [ ] **12.9** Test template rendering
- [ ] **12.10** Create additional built-in templates

### Verification
- [ ] Standard template loads
- [ ] Template renders with variables
- [ ] Multiple templates available
- [ ] Handlebars helpers work
- [ ] IPC returns template data

---

## Phase 13: Template System - UI

**Status:** ⬜ Not Started

**Spec Reference:** [specs/template-system.md](./specs/template-system.md) §6

### Tasks
- [ ] **13.1** Create TemplateSelector component
- [ ] **13.2** Display template cards in grid
- [ ] **13.3** Create TemplatePreview component
- [ ] **13.4** Integrate into new project flow
- [ ] **13.5** Implement custom template storage path
- [ ] **13.6** Create TemplateManager component
- [ ] **13.7** Implement create from existing
- [ ] **13.8** Implement template deletion
- [ ] **13.9** Implement export to .zip
- [ ] **13.10** Implement import from .zip

### Verification
- [ ] Template selector shows on new project
- [ ] Preview shows template details
- [ ] Custom templates can be created
- [ ] Templates can be exported/imported
- [ ] Templates can be deleted

---

## Phase 14: Git Integration

**Status:** ⬜ Not Started

**Spec Reference:** [specs/git-integration.md](./specs/git-integration.md)

### Tasks
- [ ] **14.1** Create GitService types and interfaces
- [ ] **14.2** Implement GitExecutor
- [ ] **14.3** Implement init, isRepo
- [ ] **14.4** Implement getStatus
- [ ] **14.5** Implement stage, unstage
- [ ] **14.6** Implement commit
- [ ] **14.7** Implement DiffParser
- [ ] **14.8** Register IPC handlers
- [ ] **14.9** Create GitStatusIndicator component
- [ ] **14.10** Add to status bar

### Verification
- [ ] Git repo can be initialized
- [ ] Status shows changes
- [ ] Commits can be created
- [ ] Diffs can be viewed
- [ ] Status indicator updates

---

## Phase 15: Git Auto-Commit

**Status:** ⬜ Not Started

**Spec Reference:** [specs/git-integration.md](./specs/git-integration.md) §4.1

### Tasks
- [ ] **15.1** Implement auto-commit in GitService
- [ ] **15.2** Add debounce logic
- [ ] **15.3** Generate commit messages
- [ ] **15.4** Connect to file watcher
- [ ] **15.5** Add auto-commit toggle to settings
- [ ] **15.6** Add auto-commit indicator to UI
- [ ] **15.7** Persist auto-commit setting
- [ ] **15.8** Test with rapid file changes
- [ ] **15.9** Handle commit failures gracefully
- [ ] **15.10** Log auto-commit activity

### Verification
- [ ] Auto-commit triggers on file save
- [ ] Debounce prevents rapid commits
- [ ] Commit messages are descriptive
- [ ] Toggle enables/disables feature
- [ ] Failures don't crash app

---

## Phase 16: Generation Modes

**Status:** ⬜ Not Started

**Spec Reference:** [specs/architecture.md](./specs/architecture.md) §3.1

### Tasks
- [ ] **16.1** Add generation mode to project settings
- [ ] **16.2** Create mode selector in ChatHeader
- [ ] **16.3** Implement incremental mode (one file, approval)
- [ ] **16.4** Implement all-at-once mode
- [ ] **16.5** Implement draft-then-refine mode
- [ ] **16.6** Update context builder with mode instructions
- [ ] **16.7** Add file approval UI for incremental
- [ ] **16.8** Show draft indicators for draft mode
- [ ] **16.9** Test each mode end-to-end
- [ ] **16.10** Document mode differences

### Verification
- [ ] Mode can be selected
- [ ] Incremental asks for approval
- [ ] All-at-once generates everything
- [ ] Draft mode marks files as drafts
- [ ] Context includes mode instructions

---

## Phase 17: File Operations

**Status:** ⬜ Not Started

**Spec Reference:** [specs/file-browser.md](./specs/file-browser.md) §5

### Tasks
- [ ] **17.1** Implement `file:create` IPC handler
- [ ] **17.2** Implement `file:rename` IPC handler
- [ ] **17.3** Implement `file:delete` IPC handler (move to trash)
- [ ] **17.4** Create ContextMenu component
- [ ] **17.5** Add context menu to file browser
- [ ] **17.6** Implement inline rename editing
- [ ] **17.7** Add delete confirmation dialog
- [ ] **17.8** Add "New File" toolbar button
- [ ] **17.9** Add "New Folder" toolbar button
- [ ] **17.10** Test all file operations

### Verification
- [ ] Right-click shows context menu
- [ ] New file creates empty file
- [ ] Rename works inline
- [ ] Delete moves to trash
- [ ] Operations trigger tree refresh

---

## Phase 18: Settings & Preferences

**Status:** ⬜ Not Started

**Spec Reference:** Various specs

### Tasks
- [ ] **18.1** Create Settings modal component
- [ ] **18.2** Add Editor section (auto-save, default mode)
- [ ] **18.3** Add Git section (auto-commit, message template)
- [ ] **18.4** Add Claude section (CLI path, timeout)
- [ ] **18.5** Add Template section (custom path)
- [ ] **18.6** Create SettingsStore with persistence
- [ ] **18.7** Apply settings across app
- [ ] **18.8** Add settings button to toolbar
- [ ] **18.9** Add keyboard shortcut `Cmd+,`
- [ ] **18.10** Test settings persistence

### Verification
- [ ] Settings modal opens
- [ ] Changes persist across restart
- [ ] Settings apply immediately
- [ ] All sections functional
- [ ] `Cmd+,` opens settings

---

## Phase 19: Error Handling & Polish

**Status:** ⬜ Not Started

**Spec Reference:** Various error handling sections

### Tasks
- [ ] **19.1** Create Toast notification system
- [ ] **19.2** Add error boundaries in React
- [ ] **19.3** Implement retry logic for failed operations
- [ ] **19.4** Add loading states throughout UI
- [ ] **19.5** Add empty states (no files, no messages)
- [ ] **19.6** Improve accessibility (ARIA labels, focus)
- [ ] **19.7** Add window menu (File, Edit, View, Help)
- [ ] **19.8** Add About dialog
- [ ] **19.9** Handle uncaught exceptions in main process
- [ ] **19.10** Test edge cases and error scenarios

### Verification
- [ ] Errors show toast notifications
- [ ] Crashes don't lose data
- [ ] Loading states visible
- [ ] Empty states guide user
- [ ] App is keyboard navigable

---

## Phase 20: Testing

**Status:** ⬜ Not Started

**Spec Reference:** [specs/architecture.md](./specs/architecture.md) §9

### Tasks
- [ ] **20.1** Write unit tests for services (git, claude, template)
- [ ] **20.2** Write unit tests for stores
- [ ] **20.3** Write component tests for major components
- [ ] **20.4** Mock IPC for renderer tests
- [ ] **20.5** Set up Playwright for E2E tests
- [ ] **20.6** Write E2E test for new project flow
- [ ] **20.7** Write E2E test for chat conversation
- [ ] **20.8** Write E2E test for file editing
- [ ] **20.9** Set up CI pipeline
- [ ] **20.10** Achieve 70% code coverage

### Verification
- [ ] All unit tests pass
- [ ] All component tests pass
- [ ] E2E tests pass
- [ ] Coverage meets target
- [ ] CI runs on every commit

---

## Phase 21: Packaging & Distribution

**Status:** ⬜ Not Started

**Spec Reference:** Standard Electron packaging

### Tasks
- [ ] **21.1** Configure electron-builder for macOS
- [ ] **21.2** Configure electron-builder for Windows
- [ ] **21.3** Configure electron-builder for Linux
- [ ] **21.4** Set up code signing (macOS)
- [ ] **21.5** Set up code signing (Windows)
- [ ] **21.6** Create application icons
- [ ] **21.7** Configure auto-updater
- [ ] **21.8** Test built applications
- [ ] **21.9** Create release workflow
- [ ] **21.10** Document installation process

### Verification
- [ ] macOS DMG installs and runs
- [ ] Windows installer works
- [ ] Linux AppImage runs
- [ ] Auto-updater functions
- [ ] All platforms tested

---

## Progress Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project Setup | ✅ Complete |
| 2 | Core Layout | ✅ Complete |
| 3 | File Browser | ✅ Complete |
| 4 | File Watching | ✅ Complete |
| 5 | Markdown Editor - Basic | ✅ Complete |
| 6 | Markdown Editor - WYSIWYG | ✅ Complete |
| 7 | Editor File Sync | 🔄 In Progress |
| 8 | Chat Interface - Display | ⬜ Not Started |
| 9 | Chat Interface - Input | ⬜ Not Started |
| 10 | Claude Service | ⬜ Not Started |
| 11 | Context Management | ⬜ Not Started |
| 12 | Template System - Core | ⬜ Not Started |
| 13 | Template System - UI | ⬜ Not Started |
| 14 | Git Integration | ⬜ Not Started |
| 15 | Git Auto-Commit | ⬜ Not Started |
| 16 | Generation Modes | ⬜ Not Started |
| 17 | File Operations | ⬜ Not Started |
| 18 | Settings & Preferences | ⬜ Not Started |
| 19 | Error Handling & Polish | ⬜ Not Started |
| 20 | Testing | ⬜ Not Started |
| 21 | Packaging & Distribution | ⬜ Not Started |
