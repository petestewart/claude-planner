# Spec Planner Specifications

Design documentation for the Spec Planner application - an Electron-based tool for creating software specifications and implementation plans.

## Core Architecture

| Spec | Code | Purpose |
|------|------|---------|
| [architecture.md](./architecture.md) | `src/` | System design, module boundaries, and data flow |

## User Interface

| Spec | Code | Purpose |
|------|------|---------|
| [ui-layout.md](./ui-layout.md) | `src/renderer/components/layout/` | Main window layout with split panes |
| [file-browser.md](./file-browser.md) | `src/renderer/components/file-browser/` | Directory tree and file selection |
| [markdown-editor.md](./markdown-editor.md) | `src/renderer/components/editor/` | Rich text/markdown editing with mode toggle |
| [chat-interface.md](./chat-interface.md) | `src/renderer/components/chat/` | Chat terminal for agent interaction |

## Backend Services

| Spec | Code | Purpose |
|------|------|---------|
| [claude-integration.md](./claude-integration.md) | `src/main/services/claude/` | Claude Code CLI subprocess management |
| [git-integration.md](./git-integration.md) | `src/main/services/git/` | Version control operations (extractable module) |
| [template-system.md](./template-system.md) | `src/templates/` | Built-in and custom spec templates |

## Design Principles

### Modular Architecture
All major components are designed as extractable modules. The application may eventually become part of a larger app creation/orchestration suite. Each service and component:
- Has clear input/output contracts (TypeScript interfaces)
- Manages its own state
- Communicates via well-defined APIs (IPC for main/renderer)
- Can be tested in isolation

### Spec-Driven Development
This application generates spec files following the methodology in [DESIGN_PHILOSOPHY.md](../DESIGN_PHILOSOPHY.md):
- CLAUDE.md for agent guidelines
- specs/ directory with feature specifications
- PLAN.md for progress tracking
- Phased implementation with verification

**Implementation Plan:** [PLAN.md](../PLAN.md) — Progress tracking with phase status
