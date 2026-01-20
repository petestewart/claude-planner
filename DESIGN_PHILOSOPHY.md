# Spec-Driven Agent Development: A Methodology for Building Software with AI Agents

## Introduction

This article describes a development methodology where markdown documents serve as the executable specification for both human developers and AI agents. The approach creates a feedback loop: specifications define intent, agents implement code, plans track progress, and documentation stays synchronized with reality.

The core insight: **if you write specifications detailed enough for an AI agent to implement, you've also written excellent documentation for humans.**

---

## The Philosophy

### Three Laws of Spec-Driven Development

1. **Specs describe intent; code describes reality.** Never assume a spec is implemented. Always verify against the codebase.

2. **Everything is traceable.** Every implementation links to a spec section. Every completion includes a commit hash. Every decision has a paper trail.

3. **Incremental delivery over big-bang releases.** Break work into 10-15 phases. Each phase is independently deployable and verifiable.

### Why This Works for AI Agents

AI agents excel when given:
- **Clear boundaries** (what's in scope, what's not)
- **Concrete examples** (type definitions, API shapes, code samples)
- **Verification criteria** (how to test that it works)
- **Explicit context** (where to find related information)

Traditional documentation optimizes for human skimming. Spec-driven documentation optimizes for systematic execution.

---

## The Document Architecture

```
project/
├── CLAUDE.md                    # Entry point: "How to work here"
├── prompt.md                    # Active task: "What to do now"
├── PLAN.md                      # Progress tracker: "What's done, what's next"
├── specs/
│   ├── README.md               # Index: "What specs exist"
│   └── [feature].md            # Blueprints: "What to build"
└── .agents/
    └── workflows/
        └── [task].md           # Automation: "Recurring agent tasks"
```

### Document Relationships

```
                    ┌─────────────┐
                    │  CLAUDE.md  │ ◄── Agent reads first
                    │  (How)      │
                    └──────┬──────┘
                           │ points to
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌─────────────────┐
    │ prompt.md  │  │specs/README│  │.agents/workflows│
    │ (Now)      │  │ (Index)    │  │ (Automated)     │
    └─────┬──────┘  └─────┬──────┘  └─────────────────┘
          │               │
          │               ▼
          │        ┌────────────┐
          │        │ specs/*.md │
          │        │ (What)     │
          │        └─────┬──────┘
          │              │
          ▼              ▼
    ┌─────────────────────────┐
    │        PLAN.md          │
    │   (Progress Tracker)    │
    └─────────────────────────┘
```

---

## Step 1: Create the Entry Point (CLAUDE.md)

The entry point document answers: **"How do I work in this repository?"**

### Template

```markdown
# Project Agent Guidelines

## Specifications

**IMPORTANT:** Before implementing any feature, consult `specs/README.md`.

- **Assume NOT implemented.** Specs describe planned features that may not exist.
- **Check the codebase first.** Specs describe intent; code describes reality.
- **Use specs as guidance.** Follow the patterns and types defined in specs.

## Commands

### Build
- **Build:** `[your build command]`
- **Test:** `[your test command]`
- **Lint:** `[your lint command]`

### Development
- **Run locally:** `[command with env vars]`
- **Run tests:** `[test command with filters]`

## Deployment

[How code gets to production - CI/CD, manual steps, verification]

## Architecture

[Brief overview: tech stack, directory structure, key patterns]

## Code Style

- **Formatting:** [tools and rules]
- **Errors:** [error handling patterns]
- **Naming:** [conventions]
- **Testing:** [test philosophy - unit, integration, property-based]

## Common Patterns

[Project-specific patterns agents should follow]
```

### Key Principles

1. **Actionable commands** - Copy-paste ready, not vague descriptions
2. **Verification steps** - How to confirm something worked
3. **Architecture overview** - Just enough to navigate, not exhaustive
4. **Style enforcement** - Concrete rules, not preferences

---

## Step 2: Create the Specification Index (specs/README.md)

The index answers: **"What specifications exist and where do I find them?"**

### Template

```markdown
# Project Specifications

Design documentation for [Project Name].

## Core Architecture

| Spec | Code | Purpose |
|------|------|---------|
| [architecture.md](./architecture.md) | `src/` | System design and crate structure |
| [error-handling.md](./error-handling.md) | `src/errors/` | Error types and propagation |

## Feature Area 1

| Spec | Code | Purpose |
|------|------|---------|
| [feature-a.md](./feature-a.md) | `src/feature_a/` | Description of Feature A |
| [feature-b.md](./feature-b.md) | `src/feature_b/` | Description of Feature B |

## Feature Area 2

| Spec | Code | Purpose |
|------|------|---------|
| [feature-c.md](./feature-c.md) | `src/feature_c/` | Description of Feature C |

**Implementation Plan:** [PLAN.md](../PLAN.md) — Progress tracking with phase status
```

### Key Principles

1. **Categorize by domain** - Group related specs together
2. **Link spec to code** - Show where implementation lives
3. **One-line purpose** - Scannable descriptions
4. **Point to plan** - Connect specs to implementation tracking

---

## Step 3: Write Individual Specifications (specs/[feature].md)

Each spec answers: **"What exactly should I build?"**

### Template Structure

```markdown
# Feature Name

**Status:** Planned | In Progress | Implemented
**Version:** 1.0
**Last Updated:** YYYY-MM-DD

## 1. Overview

### Purpose
[One paragraph: what problem this solves and why it matters]

### Goals
- [Concrete goal 1]
- [Concrete goal 2]
- [Concrete goal 3]

### Non-Goals
- [Explicitly out of scope item 1]
- [Explicitly out of scope item 2]

## 2. Architecture

### Directory Structure
```
src/feature_name/
├── mod.rs           # Public exports
├── types.rs         # Core types
├── repository.rs    # Data access
└── api.rs           # HTTP handlers
```

### Component Diagram
```
┌─────────┐     ┌────────────┐     ┌──────────┐
│ Client  │────▶│ API Layer  │────▶│ Database │
└─────────┘     └────────────┘     └──────────┘
```

### Data Flow
[Describe how data moves through the system]

## 3. Core Types

### 3.1 PrimaryEntity

```rust
/// Primary entity for [purpose]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrimaryEntity {
    /// Unique identifier
    pub id: EntityId,

    /// When the entity was created
    pub created_at: DateTime<Utc>,

    /// Human-readable name
    pub name: String,

    /// Current status
    pub status: EntityStatus,
}

/// Possible states for an entity
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum EntityStatus {
    Active,
    Inactive,
    Archived,
}
```

### 3.2 Supporting Types

[Additional type definitions with documentation]

## 4. API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/feature` | Bearer | Create new entity |
| GET | `/api/feature` | Bearer | List entities with pagination |
| GET | `/api/feature/{id}` | Bearer | Get entity by ID |
| PUT | `/api/feature/{id}` | Bearer | Update entity |
| DELETE | `/api/feature/{id}` | Bearer | Delete entity |

### 4.1 Create Entity

**Request:**
```json
{
  "name": "Example Entity",
  "status": "active"
}
```

**Response (201):**
```json
{
  "id": "ent_abc123",
  "name": "Example Entity",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `400` - Invalid request body
- `401` - Missing or invalid auth token
- `409` - Entity with name already exists

## 5. Database Schema

```sql
-- Migration: NNN_feature_name.sql

CREATE TABLE feature_entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

CREATE INDEX idx_feature_entities_status ON feature_entities(status);
CREATE UNIQUE INDEX idx_feature_entities_name ON feature_entities(name);
```

## 6. Business Logic

### 6.1 Validation Rules

- Name must be 1-100 characters
- Name must be unique within the system
- Status transitions: Active → Inactive → Archived (one-way)

### 6.2 Side Effects

- Creating entity sends webhook notification
- Archiving entity triggers cleanup job after 30 days

## 7. Error Handling

```rust
#[derive(Debug, thiserror::Error)]
pub enum FeatureError {
    #[error("Entity not found: {0}")]
    NotFound(EntityId),

    #[error("Entity with name already exists: {0}")]
    DuplicateName(String),

    #[error("Invalid status transition from {from} to {to}")]
    InvalidTransition { from: EntityStatus, to: EntityStatus },

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
}
```

## 8. Testing Strategy

### Unit Tests
- Validation logic for all fields
- Status transition rules

### Integration Tests
- CRUD operations through API
- Error responses for edge cases

### Property-Based Tests
- ID generation uniqueness
- Serialization round-trips

## 9. Security Considerations

- All endpoints require authentication
- IDs are opaque (no sequential integers)
- Soft delete preserves audit trail

## 10. Implementation Phases

### Phase 1: Core Types
**Goal:** Define shared types and validation
- [ ] Create module structure
- [ ] Define entity types
- [ ] Implement validation
- [ ] Add unit tests

### Phase 2: Database Layer
**Goal:** Persistence with repository pattern
- [ ] Write SQL migration
- [ ] Implement repository trait
- [ ] Add database tests

### Phase 3: API Endpoints
**Goal:** HTTP interface
- [ ] Implement POST endpoint
- [ ] Implement GET (single) endpoint
- [ ] Implement GET (list) endpoint
- [ ] Implement PUT endpoint
- [ ] Implement DELETE endpoint
- [ ] Add API tests

### Phase 4: Integration
**Goal:** Connect to rest of system
- [ ] Add webhook notifications
- [ ] Integrate with auth system
- [ ] Add to API documentation

### Phase 5: Production Readiness
**Goal:** Monitoring and reliability
- [ ] Add metrics
- [ ] Add structured logging
- [ ] Load testing
- [ ] Documentation review
```

### Key Principles for Specs

1. **Full type definitions** - Not pseudocode, actual compilable types
2. **Concrete examples** - Real JSON, real SQL, real code
3. **Explicit phases** - Break implementation into deployable chunks
4. **Error cases first** - Define what can go wrong
5. **Non-goals are goals** - Explicitly state what you won't build

---

## Step 4: Create the Progress Tracker (PLAN.md)

The plan answers: **"What's done and what's next?"**

### Template

```markdown
# Implementation Plan

**Status:** In Progress
**Last Updated:** YYYY-MM-DD

## Recent Progress

**YYYY-MM-DD:** Completed Feature A Phase 2 ✅ DEPLOYED
- Implemented repository layer with full CRUD
- Added 15 integration tests, all passing
- Verified in production via curl
- Commit: `abc1234`

**YYYY-MM-DD:** Completed Feature A Phase 1 ✅ COMPLETED
- Created module structure and core types
- Added validation with property-based tests
- Commit: `def5678`

## Quick Reference

| Feature | Spec | Code Location | Status |
|---------|------|---------------|--------|
| Feature A | [feature-a.md](specs/feature-a.md) | `src/feature_a/` | Phase 2/5 |
| Feature B | [feature-b.md](specs/feature-b.md) | `src/feature_b/` | Not Started |

## Feature A Implementation

### Phase 1: Core Types ✅ COMPLETED
**Goal:** Define shared types and validation
**Reference:** [specs/feature-a.md#3-core-types](specs/feature-a.md)
- [x] Create module structure
- [x] Define entity types
- [x] Implement validation
- [x] Add unit tests
- Commit: `def5678`

### Phase 2: Database Layer ✅ COMPLETED
**Goal:** Persistence with repository pattern
**Reference:** [specs/feature-a.md#5-database-schema](specs/feature-a.md)
- [x] Write SQL migration
- [x] Implement repository trait
- [x] Add database tests
- Commit: `abc1234`

### Phase 3: API Endpoints 🔄 IN PROGRESS
**Goal:** HTTP interface
**Reference:** [specs/feature-a.md#4-api-endpoints](specs/feature-a.md)
- [x] Implement POST endpoint
- [x] Implement GET (single) endpoint
- [ ] Implement GET (list) endpoint
- [ ] Implement PUT endpoint
- [ ] Implement DELETE endpoint
- [ ] Add API tests

### Phase 4: Integration ⏳ PENDING
**Goal:** Connect to rest of system
**Reference:** [specs/feature-a.md#6-business-logic](specs/feature-a.md)
- [ ] Add webhook notifications
- [ ] Integrate with auth system
- [ ] Add to API documentation

### Phase 5: Production Readiness ⏳ PENDING
**Goal:** Monitoring and reliability
- [ ] Add metrics
- [ ] Add structured logging
- [ ] Load testing
- [ ] Documentation review

## Feature B Implementation

[Phases listed when work begins]
```

### Key Principles for Plans

1. **Reverse chronological progress** - Newest first for quick scanning
2. **Commit hashes** - Every completion is traceable
3. **Verification notes** - How you know it works
4. **Spec section links** - Connect tasks to requirements
5. **Status emojis** - Visual scanning (✅ 🔄 ⏳)

---

## Step 5: Define Active Tasks (prompt.md)

The prompt answers: **"What should I do right now?"**

### Template

```markdown
## Current Task

Study specs/README.md to understand the system.
Review PLAN.md and pick the next incomplete phase.
Implement the functionality following the spec exactly.
Validate via tests and manual verification.

## Instructions

- Update PLAN.md when each task completes
- Include commit hash in progress notes
- Add tests for new functionality
- Commit and push when done

## Context

[Any specific context for current work sprint]
```

### Key Principles

1. **Short and directive** - This is a command, not documentation
2. **Reference other docs** - Point to specs and plans, don't duplicate
3. **Verification required** - Always include how to confirm completion
4. **Update the plan** - Close the loop by requiring plan updates

---

## Step 6: Automate Recurring Tasks (.agents/workflows/)

Workflow files answer: **"What should agents do automatically?"**

### Template

```markdown
# Workflow: [Name]

## Trigger
[When this workflow runs - schedule, event, condition]

## Task
[What the agent should do]

## Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Success Criteria
[How to verify the workflow succeeded]

## Error Handling
[What to do if something fails]
```

### Example Use Cases

- **Deployment monitoring** - Watch for failures, auto-fix common issues
- **Dependency updates** - Check for outdated packages, create PRs
- **Test maintenance** - Run tests, report flaky tests
- **Documentation sync** - Verify docs match code

---

## The Complete Workflow

### Starting a New Project

1. **Create CLAUDE.md** with build commands, architecture, and style guide
2. **Create specs/README.md** as empty index
3. **Create PLAN.md** with project milestones
4. **Write first spec** for core architecture
5. **Create prompt.md** pointing to first task

### Adding a New Feature

1. **Write the spec** in `specs/[feature].md` with all sections
2. **Add to index** in `specs/README.md`
3. **Add phases to PLAN.md** with checkboxes
4. **Update prompt.md** to point to new work
5. **Implement phase by phase**, updating plan after each

### Daily Development Loop

```
┌─────────────────────────────────────┐
│ 1. Read prompt.md for current task  │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 2. Read PLAN.md for next phase      │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 3. Read spec section for that phase │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 4. Implement following spec exactly │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 5. Test and verify                  │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 6. Update PLAN.md with completion   │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 7. Commit with reference to phase   │
└─────────────────────────────────────┘
```

---

## Anti-Patterns to Avoid

### 1. Vague Specs
**Bad:** "The system should handle errors gracefully"
**Good:** Full error enum with variants, messages, and HTTP status codes

### 2. Missing Non-Goals
**Bad:** Spec that doesn't mention what's out of scope
**Good:** Explicit non-goals that prevent scope creep

### 3. Orphan Plans
**Bad:** Plan phases that don't link to spec sections
**Good:** Every checkbox references its spec section

### 4. Stale Documentation
**Bad:** Plan shows Phase 3 in progress but code is on Phase 5
**Good:** Plan updated immediately after each completion

### 5. Big-Bang Phases
**Bad:** "Phase 2: Implement the entire API"
**Good:** One endpoint per checkbox, deployable incrementally

---

## Measuring Success

### Documentation Health Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Plan staleness | Updated today | Updated this week | Updated > 1 week ago |
| Spec coverage | All features have specs | Core features covered | Specs missing for active work |
| Phase granularity | 3-5 tasks per phase | 6-10 tasks | 10+ tasks |
| Verification notes | Every completion verified | Most verified | Completions without verification |

### Agent Effectiveness Signals

- Agent can implement from spec without clarifying questions
- Implementations match spec exactly (no creative interpretation)
- Tests pass on first commit
- Plan stays synchronized with code state

---

## Conclusion

Spec-driven agent development inverts the traditional documentation problem. Instead of documentation lagging behind code, specifications lead implementation. The methodology works because:

1. **Specs are detailed enough to execute** - Types, APIs, schemas, phases
2. **Plans create accountability** - Checkboxes and commit hashes
3. **The loop closes itself** - Completing work requires updating docs
4. **Agents and humans read the same source** - No translation layer

The initial investment in specification detail pays compound returns: AI agents implement faster, humans onboard quicker, and the codebase stays documented by default.
