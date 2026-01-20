# Template System

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-20

## 1. Overview

### Purpose
Provide built-in and custom templates for generating spec documents. Templates define the structure, sections, and prompts used when creating CLAUDE.md, specs/, and PLAN.md files for different project types.

### Goals
- Ship with built-in templates for common project types
- Allow users to create and save custom templates
- Support template variables for project-specific values
- Define question flows for requirements gathering
- Enable template sharing (export/import)

### Non-Goals
- Template marketplace or online repository
- Template versioning or migration
- Visual template editor (use markdown directly)

## 2. Architecture

### Component Structure

```
src/
├── main/services/templates/
│   ├── index.ts                # Public exports
│   ├── types.ts                # Type definitions
│   ├── template-service.ts     # Main service
│   ├── template-loader.ts      # Load from disk
│   └── template-renderer.ts    # Render with variables
├── renderer/components/templates/
│   ├── TemplateSelector.tsx    # Template selection UI
│   ├── TemplatePreview.tsx     # Preview template content
│   └── TemplateManager.tsx     # Create/edit/delete
└── templates/                  # Built-in templates
    ├── standard/
    │   ├── template.json       # Template metadata
    │   ├── CLAUDE.md.hbs       # Handlebars template
    │   ├── specs-README.md.hbs
    │   └── PLAN.md.hbs
    ├── web-app/
    ├── cli-tool/
    ├── library/
    └── api-service/
```

### Template Storage

```
Built-in templates:
  ${app}/templates/              # Shipped with app

Custom templates:
  ${userData}/spec-planner/templates/  # User-created
    ├── my-template/
    │   ├── template.json
    │   └── *.md.hbs
```

## 3. Core Types

### 3.1 Template Types

```typescript
/**
 * Template metadata and configuration
 */
interface Template {
  /** Unique template identifier */
  id: string

  /** Display name */
  name: string

  /** Brief description */
  description: string

  /** Template category */
  category: TemplateCategory

  /** Author (for custom templates) */
  author?: string

  /** Version string */
  version: string

  /** When template was created */
  createdAt: string

  /** When template was last modified */
  updatedAt: string

  /** Whether this is a built-in template */
  isBuiltIn: boolean

  /** Files included in this template */
  files: TemplateFile[]

  /** Variables required by this template */
  variables: TemplateVariable[]

  /** Question flow for requirements gathering */
  questionFlow: QuestionSection[]

  /** Default generation mode */
  defaultGenerationMode: GenerationMode

  /** Tags for filtering */
  tags: string[]
}

type TemplateCategory =
  | 'web-app'
  | 'cli-tool'
  | 'library'
  | 'api-service'
  | 'mobile-app'
  | 'desktop-app'
  | 'other'

/**
 * A file within the template
 */
interface TemplateFile {
  /** Output file path (can use variables) */
  outputPath: string

  /** Handlebars template content or path to .hbs file */
  template: string

  /** File description */
  description: string

  /** Whether file is required or optional */
  required: boolean
}

/**
 * Variable that can be substituted in templates
 */
interface TemplateVariable {
  /** Variable name (used as {{name}} in templates) */
  name: string

  /** Display label */
  label: string

  /** Variable type */
  type: 'string' | 'boolean' | 'array' | 'select'

  /** Default value */
  default?: unknown

  /** Options for select type */
  options?: { value: string; label: string }[]

  /** Whether variable is required */
  required: boolean

  /** Help text */
  description?: string
}
```

### 3.2 Question Flow Types

```typescript
/**
 * Section of questions for requirements gathering
 */
interface QuestionSection {
  /** Section identifier */
  id: string

  /** Section title */
  title: string

  /** Questions in this section */
  questions: TemplateQuestion[]

  /** Condition for showing this section */
  condition?: QuestionCondition
}

/**
 * A question to ask during requirements gathering
 */
interface TemplateQuestion {
  /** Question identifier */
  id: string

  /** Question text */
  text: string

  /** Type of response expected */
  type: 'text' | 'multiline' | 'select' | 'multiselect' | 'boolean'

  /** Options for select/multiselect */
  options?: { value: string; label: string }[]

  /** Variable to store answer in */
  variable: string

  /** Whether question is required */
  required: boolean

  /** Follow-up prompt for Claude to elaborate */
  followUpPrompt?: string

  /** Condition for showing this question */
  condition?: QuestionCondition
}

/**
 * Condition for conditional questions/sections
 */
interface QuestionCondition {
  /** Variable to check */
  variable: string

  /** Operator */
  operator: 'equals' | 'notEquals' | 'contains' | 'notEmpty'

  /** Value to compare against */
  value?: unknown
}
```

### 3.3 Service Types

```typescript
/**
 * Template service interface
 */
interface TemplateService {
  /** List all available templates */
  listTemplates(): Promise<TemplateInfo[]>

  /** Get full template by ID */
  getTemplate(id: string): Promise<Template>

  /** Save custom template */
  saveTemplate(template: Template): Promise<void>

  /** Delete custom template */
  deleteTemplate(id: string): Promise<void>

  /** Render template with variables */
  renderTemplate(templateId: string, variables: Record<string, unknown>): Promise<RenderedTemplate>

  /** Export template for sharing */
  exportTemplate(id: string): Promise<Blob>

  /** Import template from file */
  importTemplate(file: File): Promise<Template>
}

/**
 * Brief template info for listing
 */
interface TemplateInfo {
  id: string
  name: string
  description: string
  category: TemplateCategory
  isBuiltIn: boolean
  tags: string[]
}

/**
 * Result of rendering a template
 */
interface RenderedTemplate {
  files: RenderedFile[]
}

interface RenderedFile {
  path: string
  content: string
}
```

## 4. Built-in Templates

### 4.1 Standard Template

Default template suitable for most projects.

```json
{
  "id": "standard",
  "name": "Standard",
  "description": "General-purpose template for any project type",
  "category": "other",
  "version": "1.0.0",
  "isBuiltIn": true,
  "files": [
    {
      "outputPath": "CLAUDE.md",
      "template": "CLAUDE.md.hbs",
      "description": "Agent guidelines and project overview",
      "required": true
    },
    {
      "outputPath": "specs/README.md",
      "template": "specs-README.md.hbs",
      "description": "Specification index",
      "required": true
    },
    {
      "outputPath": "PLAN.md",
      "template": "PLAN.md.hbs",
      "description": "Implementation plan and progress tracker",
      "required": true
    }
  ],
  "variables": [
    {
      "name": "projectName",
      "label": "Project Name",
      "type": "string",
      "required": true
    },
    {
      "name": "projectDescription",
      "label": "Project Description",
      "type": "multiline",
      "required": true
    },
    {
      "name": "targetLanguage",
      "label": "Primary Language",
      "type": "select",
      "options": [
        { "value": "typescript", "label": "TypeScript" },
        { "value": "javascript", "label": "JavaScript" },
        { "value": "python", "label": "Python" },
        { "value": "rust", "label": "Rust" },
        { "value": "go", "label": "Go" },
        { "value": "java", "label": "Java" },
        { "value": "other", "label": "Other" }
      ],
      "required": true
    }
  ],
  "questionFlow": [
    {
      "id": "overview",
      "title": "Project Overview",
      "questions": [
        {
          "id": "problem",
          "text": "What problem does this application solve?",
          "type": "multiline",
          "variable": "problemStatement",
          "required": true,
          "followUpPrompt": "Can you tell me more about the specific pain points users face?"
        },
        {
          "id": "users",
          "text": "Who are the target users?",
          "type": "multiline",
          "variable": "targetUsers",
          "required": true
        }
      ]
    },
    {
      "id": "features",
      "title": "Core Features",
      "questions": [
        {
          "id": "coreFeatures",
          "text": "What are the must-have features?",
          "type": "multiline",
          "variable": "coreFeatures",
          "required": true
        },
        {
          "id": "niceToHave",
          "text": "What features would be nice to have but aren't essential?",
          "type": "multiline",
          "variable": "niceToHaveFeatures",
          "required": false
        }
      ]
    }
  ],
  "defaultGenerationMode": "incremental",
  "tags": ["general", "starter"]
}
```

### 4.2 Web App Template

```json
{
  "id": "web-app",
  "name": "Web Application",
  "description": "Template for modern web applications (React, Vue, etc.)",
  "category": "web-app",
  "version": "1.0.0",
  "isBuiltIn": true,
  "files": [
    { "outputPath": "CLAUDE.md", "template": "CLAUDE.md.hbs", "required": true },
    { "outputPath": "specs/README.md", "template": "specs-README.md.hbs", "required": true },
    { "outputPath": "specs/architecture.md", "template": "architecture.md.hbs", "required": true },
    { "outputPath": "specs/ui-design.md", "template": "ui-design.md.hbs", "required": true },
    { "outputPath": "specs/api-integration.md", "template": "api-integration.md.hbs", "required": false },
    { "outputPath": "specs/authentication.md", "template": "authentication.md.hbs", "required": false },
    { "outputPath": "PLAN.md", "template": "PLAN.md.hbs", "required": true }
  ],
  "variables": [
    { "name": "projectName", "label": "Project Name", "type": "string", "required": true },
    { "name": "framework", "label": "Frontend Framework", "type": "select", "options": [
      { "value": "react", "label": "React" },
      { "value": "vue", "label": "Vue" },
      { "value": "svelte", "label": "Svelte" },
      { "value": "nextjs", "label": "Next.js" },
      { "value": "other", "label": "Other" }
    ], "required": true },
    { "name": "hasBackend", "label": "Includes Backend?", "type": "boolean", "default": true },
    { "name": "hasAuth", "label": "Requires Authentication?", "type": "boolean", "default": false }
  ],
  "questionFlow": [
    {
      "id": "overview",
      "title": "Project Overview",
      "questions": [
        { "id": "appType", "text": "What type of web application is this?", "type": "multiline", "variable": "appType", "required": true },
        { "id": "users", "text": "Who will use this application?", "type": "multiline", "variable": "targetUsers", "required": true }
      ]
    },
    {
      "id": "ui",
      "title": "User Interface",
      "questions": [
        { "id": "pages", "text": "What are the main pages/views?", "type": "multiline", "variable": "mainPages", "required": true },
        { "id": "responsive", "text": "Does it need to work on mobile?", "type": "boolean", "variable": "isMobileResponsive", "required": true }
      ]
    },
    {
      "id": "backend",
      "title": "Backend & Data",
      "condition": { "variable": "hasBackend", "operator": "equals", "value": true },
      "questions": [
        { "id": "dataTypes", "text": "What data will the app store?", "type": "multiline", "variable": "dataTypes", "required": true },
        { "id": "externalApis", "text": "Will it integrate with external APIs?", "type": "multiline", "variable": "externalApis", "required": false }
      ]
    },
    {
      "id": "auth",
      "title": "Authentication",
      "condition": { "variable": "hasAuth", "operator": "equals", "value": true },
      "questions": [
        { "id": "authMethods", "text": "What authentication methods?", "type": "multiselect", "options": [
          { "value": "email", "label": "Email/Password" },
          { "value": "oauth-google", "label": "Google OAuth" },
          { "value": "oauth-github", "label": "GitHub OAuth" },
          { "value": "magic-link", "label": "Magic Link" }
        ], "variable": "authMethods", "required": true }
      ]
    }
  ],
  "defaultGenerationMode": "incremental",
  "tags": ["web", "frontend", "react", "vue"]
}
```

### 4.3 CLI Tool Template

```json
{
  "id": "cli-tool",
  "name": "CLI Tool",
  "description": "Template for command-line interface applications",
  "category": "cli-tool",
  "version": "1.0.0",
  "isBuiltIn": true,
  "files": [
    { "outputPath": "CLAUDE.md", "template": "CLAUDE.md.hbs", "required": true },
    { "outputPath": "specs/README.md", "template": "specs-README.md.hbs", "required": true },
    { "outputPath": "specs/commands.md", "template": "commands.md.hbs", "required": true },
    { "outputPath": "specs/configuration.md", "template": "configuration.md.hbs", "required": false },
    { "outputPath": "PLAN.md", "template": "PLAN.md.hbs", "required": true }
  ],
  "variables": [
    { "name": "projectName", "label": "Tool Name", "type": "string", "required": true },
    { "name": "cliName", "label": "CLI Command Name", "type": "string", "required": true },
    { "name": "targetLanguage", "label": "Language", "type": "select", "options": [
      { "value": "rust", "label": "Rust" },
      { "value": "go", "label": "Go" },
      { "value": "python", "label": "Python" },
      { "value": "typescript", "label": "TypeScript (Node)" }
    ], "required": true }
  ],
  "questionFlow": [
    {
      "id": "overview",
      "title": "Tool Overview",
      "questions": [
        { "id": "purpose", "text": "What does this CLI tool do?", "type": "multiline", "variable": "toolPurpose", "required": true },
        { "id": "audience", "text": "Who will use this tool?", "type": "multiline", "variable": "targetAudience", "required": true }
      ]
    },
    {
      "id": "commands",
      "title": "Commands",
      "questions": [
        { "id": "mainCommands", "text": "What are the main commands/subcommands?", "type": "multiline", "variable": "mainCommands", "required": true },
        { "id": "globalFlags", "text": "What global flags/options should exist?", "type": "multiline", "variable": "globalFlags", "required": false }
      ]
    },
    {
      "id": "io",
      "title": "Input/Output",
      "questions": [
        { "id": "inputSources", "text": "What input does the tool accept?", "type": "multiselect", "options": [
          { "value": "args", "label": "Command arguments" },
          { "value": "stdin", "label": "Standard input (piping)" },
          { "value": "files", "label": "File paths" },
          { "value": "interactive", "label": "Interactive prompts" }
        ], "variable": "inputSources", "required": true },
        { "id": "outputFormats", "text": "What output formats?", "type": "multiselect", "options": [
          { "value": "text", "label": "Plain text" },
          { "value": "json", "label": "JSON" },
          { "value": "table", "label": "Table format" }
        ], "variable": "outputFormats", "required": true }
      ]
    }
  ],
  "defaultGenerationMode": "incremental",
  "tags": ["cli", "terminal", "command-line"]
}
```

### 4.4 Library Template

```json
{
  "id": "library",
  "name": "Library/Package",
  "description": "Template for reusable libraries and packages",
  "category": "library",
  "version": "1.0.0",
  "isBuiltIn": true,
  "files": [
    { "outputPath": "CLAUDE.md", "template": "CLAUDE.md.hbs", "required": true },
    { "outputPath": "specs/README.md", "template": "specs-README.md.hbs", "required": true },
    { "outputPath": "specs/api-design.md", "template": "api-design.md.hbs", "required": true },
    { "outputPath": "PLAN.md", "template": "PLAN.md.hbs", "required": true }
  ],
  "variables": [
    { "name": "projectName", "label": "Library Name", "type": "string", "required": true },
    { "name": "targetLanguage", "label": "Language", "type": "select", "options": [
      { "value": "typescript", "label": "TypeScript/JavaScript" },
      { "value": "python", "label": "Python" },
      { "value": "rust", "label": "Rust" },
      { "value": "go", "label": "Go" }
    ], "required": true },
    { "name": "packageRegistry", "label": "Package Registry", "type": "select", "options": [
      { "value": "npm", "label": "npm" },
      { "value": "pypi", "label": "PyPI" },
      { "value": "crates", "label": "crates.io" },
      { "value": "other", "label": "Other" }
    ], "required": true }
  ],
  "questionFlow": [
    {
      "id": "overview",
      "title": "Library Overview",
      "questions": [
        { "id": "purpose", "text": "What functionality does this library provide?", "type": "multiline", "variable": "libraryPurpose", "required": true },
        { "id": "useCases", "text": "What are the primary use cases?", "type": "multiline", "variable": "useCases", "required": true }
      ]
    },
    {
      "id": "api",
      "title": "API Design",
      "questions": [
        { "id": "mainTypes", "text": "What are the main types/classes?", "type": "multiline", "variable": "mainTypes", "required": true },
        { "id": "mainFunctions", "text": "What are the key functions/methods?", "type": "multiline", "variable": "mainFunctions", "required": true }
      ]
    }
  ],
  "defaultGenerationMode": "incremental",
  "tags": ["library", "package", "sdk"]
}
```

### 4.5 API Service Template

```json
{
  "id": "api-service",
  "name": "API Service",
  "description": "Template for REST or GraphQL APIs",
  "category": "api-service",
  "version": "1.0.0",
  "isBuiltIn": true,
  "files": [
    { "outputPath": "CLAUDE.md", "template": "CLAUDE.md.hbs", "required": true },
    { "outputPath": "specs/README.md", "template": "specs-README.md.hbs", "required": true },
    { "outputPath": "specs/endpoints.md", "template": "endpoints.md.hbs", "required": true },
    { "outputPath": "specs/data-models.md", "template": "data-models.md.hbs", "required": true },
    { "outputPath": "specs/authentication.md", "template": "authentication.md.hbs", "required": false },
    { "outputPath": "PLAN.md", "template": "PLAN.md.hbs", "required": true }
  ],
  "variables": [
    { "name": "projectName", "label": "Service Name", "type": "string", "required": true },
    { "name": "apiStyle", "label": "API Style", "type": "select", "options": [
      { "value": "rest", "label": "REST" },
      { "value": "graphql", "label": "GraphQL" },
      { "value": "grpc", "label": "gRPC" }
    ], "required": true },
    { "name": "targetLanguage", "label": "Language", "type": "select", "options": [
      { "value": "typescript", "label": "TypeScript (Node)" },
      { "value": "python", "label": "Python" },
      { "value": "go", "label": "Go" },
      { "value": "rust", "label": "Rust" }
    ], "required": true },
    { "name": "hasAuth", "label": "Requires Authentication?", "type": "boolean", "default": true }
  ],
  "questionFlow": [
    {
      "id": "overview",
      "title": "Service Overview",
      "questions": [
        { "id": "purpose", "text": "What does this API service do?", "type": "multiline", "variable": "servicePurpose", "required": true },
        { "id": "consumers", "text": "Who/what will consume this API?", "type": "multiline", "variable": "apiConsumers", "required": true }
      ]
    },
    {
      "id": "data",
      "title": "Data & Resources",
      "questions": [
        { "id": "resources", "text": "What resources/entities does the API manage?", "type": "multiline", "variable": "resources", "required": true },
        { "id": "database", "text": "What database will you use?", "type": "select", "options": [
          { "value": "postgres", "label": "PostgreSQL" },
          { "value": "mysql", "label": "MySQL" },
          { "value": "mongodb", "label": "MongoDB" },
          { "value": "sqlite", "label": "SQLite" },
          { "value": "other", "label": "Other" }
        ], "variable": "database", "required": true }
      ]
    }
  ],
  "defaultGenerationMode": "incremental",
  "tags": ["api", "backend", "rest", "graphql"]
}
```

## 5. Template Rendering

### 5.1 Handlebars Templates

```handlebars
{{! CLAUDE.md.hbs }}
# {{projectName}} - Agent Guidelines

## Overview

{{projectDescription}}

## Specifications

**IMPORTANT:** Before implementing any feature, consult `specs/README.md`.

- **Assume NOT implemented.** Specs describe planned features that may not exist.
- **Check the codebase first.** Specs describe intent; code describes reality.
- **Use specs as guidance.** Follow the patterns and types defined in specs.

## Commands

{{#if (eq targetLanguage "typescript")}}
### Build
- **Install:** `npm install`
- **Build:** `npm run build`
- **Dev:** `npm run dev`
- **Test:** `npm test`
- **Lint:** `npm run lint`
{{/if}}

{{#if (eq targetLanguage "python")}}
### Build
- **Install:** `pip install -e .`
- **Test:** `pytest`
- **Lint:** `ruff check .`
- **Format:** `ruff format .`
{{/if}}

{{#if (eq targetLanguage "rust")}}
### Build
- **Build:** `cargo build`
- **Run:** `cargo run`
- **Test:** `cargo test`
- **Lint:** `cargo clippy`
{{/if}}

## Architecture

{{#each architectureSections}}
### {{this.title}}
{{this.content}}

{{/each}}

## Code Style

{{#if codeStyleGuidelines}}
{{codeStyleGuidelines}}
{{else}}
- Follow standard {{targetLanguage}} conventions
- Use consistent formatting
- Write clear, descriptive names
- Add comments for complex logic
{{/if}}
```

### 5.2 Template Renderer

```typescript
/**
 * Renders templates using Handlebars
 */
class TemplateRenderer {
  private handlebars: typeof Handlebars

  constructor() {
    this.handlebars = Handlebars.create()
    this.registerHelpers()
  }

  private registerHelpers() {
    // Equality check
    this.handlebars.registerHelper('eq', (a, b) => a === b)

    // Not equal
    this.handlebars.registerHelper('neq', (a, b) => a !== b)

    // Array contains
    this.handlebars.registerHelper('contains', (arr, val) =>
      Array.isArray(arr) && arr.includes(val)
    )

    // Join array
    this.handlebars.registerHelper('join', (arr, sep) =>
      Array.isArray(arr) ? arr.join(sep) : ''
    )

    // Date formatting
    this.handlebars.registerHelper('date', (format) =>
      new Date().toISOString().split('T')[0]
    )
  }

  /**
   * Render a template file with variables
   */
  async render(
    templateContent: string,
    variables: Record<string, unknown>
  ): Promise<string> {
    const compiled = this.handlebars.compile(templateContent)
    return compiled(variables)
  }

  /**
   * Render all files in a template
   */
  async renderTemplate(
    template: Template,
    variables: Record<string, unknown>
  ): Promise<RenderedFile[]> {
    const renderedFiles: RenderedFile[] = []

    for (const file of template.files) {
      const content = await this.render(file.template, variables)
      const path = await this.render(file.outputPath, variables)

      renderedFiles.push({ path, content })
    }

    return renderedFiles
  }
}
```

## 6. UI Components

### 6.1 TemplateSelector

```typescript
interface TemplateSelectorProps {
  templates: TemplateInfo[]
  selectedId: string | null
  onSelect: (templateId: string) => void
  onManageTemplates: () => void
}

/**
 * Card grid showing available templates
 * - Built-in templates first
 * - Custom templates section
 * - Filter by category/tags
 * - "Manage Templates" button
 */
```

### 6.2 TemplatePreview

```typescript
interface TemplatePreviewProps {
  template: Template
  onUse: () => void
  onEdit?: () => void // Only for custom templates
}

/**
 * Shows template details:
 * - Name, description
 * - Files that will be generated
 * - Variables required
 * - Question flow preview
 * - "Use This Template" button
 */
```

### 6.3 TemplateManager

```typescript
interface TemplateManagerProps {
  onClose: () => void
}

/**
 * Modal for managing custom templates:
 * - List custom templates
 * - Create new template (copy from built-in)
 * - Edit template metadata
 * - Delete template
 * - Import/Export templates
 */
```

## 7. Implementation Phases

### Phase 1: Template Loading
**Goal:** Load built-in templates
- [ ] Create template types
- [ ] Implement TemplateLoader
- [ ] Bundle built-in templates with app
- [ ] Create TemplateService skeleton

### Phase 2: Template Rendering
**Goal:** Generate files from templates
- [ ] Set up Handlebars
- [ ] Implement TemplateRenderer
- [ ] Register custom helpers
- [ ] Create standard template files

### Phase 3: Template Selection UI
**Goal:** User can choose template
- [ ] Create TemplateSelector component
- [ ] Create TemplatePreview component
- [ ] Connect to new project flow
- [ ] Style components

### Phase 4: Custom Templates
**Goal:** Create and manage custom templates
- [ ] Implement custom template storage
- [ ] Create TemplateManager component
- [ ] Add create/edit/delete flows
- [ ] Test persistence

### Phase 5: Import/Export
**Goal:** Share templates
- [ ] Implement export to .zip
- [ ] Implement import from .zip
- [ ] Add validation
- [ ] Handle errors

### Phase 6: Additional Built-in Templates
**Goal:** Complete template library
- [ ] Create web-app template
- [ ] Create cli-tool template
- [ ] Create library template
- [ ] Create api-service template
- [ ] Test all templates
