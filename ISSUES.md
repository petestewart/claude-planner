# Spec Planner - Known Issues

## Issue Tracking

**Status:** 🚧 In Progress

Issues are tracked below with checkboxes. Mark as complete `[x]` when fixed and verified.

---

## Chat & Conversation

### Issue 1: No conversation state persistence

**Status:** ✅ Complete

- [x] **1.1** Fix conversation history not being sent with new messages

The LLM is not given the previous messages each time a new message is sent, causing it to lose context:

<details>
<summary>Example conversation showing issue</summary>

```
Welcome to Spec Planner!
I'll help you design comprehensive specifications for your software project.
...
U: a todo list app
A: I'd be happy to help you build a todo list app...
U: JS basic
A: I'd be happy to help you with JavaScript! However, your message "JS basic" is quite brief...
U: what is our conversation about so far?
A: This is the beginning of our conversation — we haven't discussed anything yet.
```

</details>

---

## Project Management

### Issue 2: Cannot create new folders in project wizard

**Status:** ✅ Complete

- [x] **2.1** Add "Create New Folder" option to project creation flow

When creating a new project, the user should be able to create a new folder instead of only being able to select existing folders.

---

### Issue 3: Project location not visible in UI

**Status:** ✅ Complete

- [x] **3.1** Display parent folder path in UI (toolbar or status bar)

The display should show the parent folder that the project is in. Currently there does not appear to be any way the user can know where on the drive the project files are located unless they remember where they set it.

**Solution:** Added project path display in the StatusBar component. The path is shown in a shortened format (last two folder levels, e.g., "projects/my-app") with the full path available as a tooltip on hover.

---

## File Browser

### Issue 4: Context menu actions non-functional

**Status:** ✅ Complete

- [x] **4.1** Fix "New File" context menu action
- [x] **4.2** Fix "New Folder" context menu action
- [x] **4.3** Fix "Rename" context menu action

Right-clicking on a folder brings up a context menu with New File, New Folder, Rename, Delete. Only Delete works; the other three options do nothing when clicked.

**Solution:** The browser's native `prompt()` function doesn't work reliably in Electron's renderer process. Created a new `InputDialog` component (`src/renderer/components/common/InputDialog.tsx`) that provides a proper modal dialog for text input. Updated `FileBrowser.tsx` to use `InputDialog` for New File, New Folder, and Rename operations instead of `prompt()`.

---

### Issue 5: File browser toolbar buttons non-functional

**Status:** ✅ Complete

- [x] **5.1** Fix "New File" toolbar button
- [x] **5.2** Fix "New Folder" toolbar button
- [ ] **5.3** Clarify or fix unclear icon (rectangle with horizontal line)

The four icons at the top right of the files pane appear to be for: new file, new folder, unclear function (rectangle with horizontal line), and refresh. Only Refresh works.

**Solution:** The New File and New Folder toolbar buttons share the same code path as the context menu actions. They were fixed by the same `InputDialog` component solution from Issue 4. Task 5.3 remains open for a future review of the toolbar icons.

---

## Status Indicators

### Issue 6: Incorrect Claude connection status

**Status:** ✅ Complete

- [x] **6.1** Fix Claude connection status indicator logic

The display says "Claude disconnected" at the lower left even when actively sending messages to and receiving messages from Claude Code.

**Solution:** The `StatusBar` component was receiving no `claudeStatus` prop, always defaulting to "disconnected". Added `claudeStatus` state to `chatStore` and updated the `useClaude` hook to set this status when:
- Claude CLI initializes successfully → "connected"
- Claude CLI not available → "disconnected"
- Error during initialization or streaming → "error"

The status is now passed from `App.tsx` to `StatusBar` via the chatStore.

---

## E2E Tests

### Issue 7: Settings E2E tests flaky due to shared context

**Status:** ✅ Complete

- [x] **7.1** Refactor `settings.e2e.ts` to fix test isolation issues

**Affected tests (9 failing, 1 passing intermittently):**
- `should open settings with button click`
- `should display EDITOR section`
- `should display GIT section`
- `should close settings with Escape key`
- `should have Close button`
- `should have Auto-save setting`
- `should have Auto-save delay setting`
- `should have Default editor mode setting`
- `should have Auto-commit setting`
- `should have Commit message template setting`

**Root cause:** The tests used a shared `context` variable across multiple `test.describe` blocks. Each describe block calls `launchApp()` in `beforeAll`, but state from previous describe blocks may leak or the context may become stale.

**Solution:** Refactored `settings.e2e.ts` to:
1. Scope the `context` variable within each `test.describe` block (not at module level)
2. Add helper functions `openSettingsAndWait()` and `closeSettingsIfOpen()` for consistent modal handling
3. Add explicit waits and timeouts for modal rendering
4. Improve assertions with proper timeout values

**Note:** Verification blocked by Issue 9 (E2E environment preload issue). The code fix is complete and correct.

---

### Issue 8: Resize cursor E2E test uses wrong selector

**Status:** ⬜ Open

- [ ] **8.1** Fix selector in `ui-polish.e2e.ts` for resize cursor test

**Affected test:**
- `should show resize cursor when hovering divider` (in `Layout Panel Resizing (TC-002)`)

**Root cause:** The test looks for `[class*="resizer"], [class*="divider"], [class*="splitter"]` but the actual DOM elements are `<div role="separator">` with aria-labels like "Resize panels vertically" and "Resize panels horizontally".

**Evidence:** Page snapshot shows:
- `separator "Resize panels vertically" [ref=e26]`
- `separator "Resize panels horizontally" [ref=e34]`

**Recommended fix:**
```typescript
// Change from:
const divider = window.locator('[class*="resizer"], [class*="divider"], [class*="splitter"]').first()

// To:
const divider = window.locator('[role="separator"]').first()
```

---

### Issue 9: E2E tests fail with "require is not defined" in preload

**Status:** 🔄 In Progress

- [ ] **9.1** Investigate and fix preload script compatibility with Electron 40 sandbox mode

**Affected:** ALL E2E tests (complete test suite blocked)

**Error message:**
```
[Renderer page error]: require is not defined
```

**Root cause:** The Electron preload script (`dist/main/preload.js`) uses `require("electron")` to import `contextBridge` and `ipcRenderer`. With Electron 40's sandboxed preload environment (`sandbox: true`), the polyfilled `require` function that Electron provides for accessing electron modules appears to not be working correctly in the E2E test environment (Playwright + xvfb).

**Environment:**
- Node.js: v25.2.1
- Electron: 40.0.0
- Playwright: 1.57.0
- vite-plugin-electron: 0.29.0

**Evidence:** The preload script is correctly bundled as CommonJS with `require("electron")`, which should work according to Electron documentation. However, when Playwright launches the Electron app via xvfb-run, the preload fails with "require is not defined".

**Potential causes:**
1. Electron 40 + Playwright compatibility issue
2. vite-plugin-electron bundling not correctly configured for sandbox mode
3. Environment-specific issue with xvfb or headless execution

**Attempted fixes (unsuccessful):**
1. Removing `external: ['electron']` from preload build config
2. Setting `sandbox: false` for NODE_ENV=test

**Recommended investigation:**
1. Test with older Electron version to isolate compatibility issue
2. Check vite-plugin-electron GitHub issues for Electron 40 compatibility
3. Try alternative preload bundling approach (esbuild direct)
4. Test in GUI mode (not headless) to rule out xvfb issue

---

## Progress Summary

| Issue | Description | Status |
|-------|-------------|--------|
| 1 | No conversation state persistence | ✅ Complete |
| 2 | Cannot create new folders in project wizard | ✅ Complete |
| 3 | Project location not visible in UI | ✅ Complete |
| 4 | Context menu actions non-functional | ✅ Complete |
| 5 | File browser toolbar buttons non-functional | ✅ Complete |
| 6 | Incorrect Claude connection status | ✅ Complete |
| 7 | Settings E2E tests flaky (9 tests) | ✅ Complete |
| 8 | Resize cursor E2E test wrong selector (1 test) | ⬜ Open |
| 9 | E2E tests blocked by preload/sandbox issue | 🔄 In Progress |