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

**Status:** 🔄 In Progress

- [ ] **3.1** Display parent folder path in UI (toolbar or status bar)

The display should show the parent folder that the project is in. Currently there does not appear to be any way the user can know where on the drive the project files are located unless they remember where they set it.

---

## File Browser

### Issue 4: Context menu actions non-functional

**Status:** ⬜ Open

- [ ] **4.1** Fix "New File" context menu action
- [ ] **4.2** Fix "New Folder" context menu action
- [ ] **4.3** Fix "Rename" context menu action

Right-clicking on a folder brings up a context menu with New File, New Folder, Rename, Delete. Only Delete works; the other three options do nothing when clicked.

---

### Issue 5: File browser toolbar buttons non-functional

**Status:** ⬜ Open

- [ ] **5.1** Fix "New File" toolbar button
- [ ] **5.2** Fix "New Folder" toolbar button
- [ ] **5.3** Clarify or fix unclear icon (rectangle with horizontal line)

The four icons at the top right of the files pane appear to be for: new file, new folder, unclear function (rectangle with horizontal line), and refresh. Only Refresh works.

---

## Status Indicators

### Issue 6: Incorrect Claude connection status

**Status:** ⬜ Open

- [ ] **6.1** Fix Claude connection status indicator logic

The display says "Claude disconnected" at the lower left even when actively sending messages to and receiving messages from Claude Code.

---

## E2E Tests

### Issue 7: Settings E2E tests flaky due to shared context

**Status:** ⬜ Open

- [ ] **7.1** Refactor `settings.e2e.ts` to fix test isolation issues

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

**Root cause:** The tests use a shared `context` variable across multiple `test.describe` blocks. Each describe block calls `launchApp()` in `beforeAll`, but state from previous describe blocks may leak or the context may become stale.

**Evidence:** Page snapshots from failing tests confirm the Settings modal IS working correctly - all content is visible (Editor section with Auto-save/Auto-save delay/Default editor mode, Git section with Auto-commit/Commit message template). The tests fail due to timing issues, not app bugs.

**Recommended fix:**
1. Move each `test.describe` block to use independent app instances
2. Add explicit waits for settings modal to be fully rendered
3. Consider combining related tests into a single describe block to share context properly
4. Add retry logic for flaky assertions

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

## Progress Summary

| Issue | Description | Status |
|-------|-------------|--------|
| 1 | No conversation state persistence | ✅ Complete |
| 2 | Cannot create new folders in project wizard | ✅ Complete |
| 3 | Project location not visible in UI | 🔄 In Progress |
| 4 | Context menu actions non-functional | ⬜ Open |
| 5 | File browser toolbar buttons non-functional | ⬜ Open |
| 6 | Incorrect Claude connection status | ⬜ Open |
| 7 | Settings E2E tests flaky (9 tests) | ⬜ Open |
| 8 | Resize cursor E2E test wrong selector (1 test) | ⬜ Open |