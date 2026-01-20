import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ProjectState,
  Requirement,
  Decision,
  GeneratedFile,
  GenerationMode,
  GitConfig,
} from '../../shared/types/project'

/**
 * Default git configuration
 */
const DEFAULT_GIT_CONFIG: GitConfig = {
  enabled: true,
  autoCommit: false,
  initialized: false,
}

/**
 * Creates a new empty project state
 */
function createEmptyProject(
  id: string,
  rootPath: string,
  name: string = 'New Project'
): ProjectState {
  const now = new Date().toISOString()
  return {
    id,
    rootPath,
    name,
    targetLanguage: 'TypeScript',
    templateId: 'standard',
    requirements: [],
    decisions: [],
    generatedFiles: [],
    generationMode: 'incremental',
    gitConfig: DEFAULT_GIT_CONFIG,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

interface ProjectStore {
  /** Current project state */
  project: ProjectState | null

  /** Whether project has unsaved changes */
  isDirty: boolean

  /** Loading state */
  isLoading: boolean

  /** Error message */
  error: string | null

  // Project lifecycle
  createProject: (rootPath: string, name?: string) => void
  loadProject: (path: string) => Promise<void>
  saveProject: () => Promise<void>
  closeProject: () => void

  // Project settings
  setProjectName: (name: string) => void
  setTargetLanguage: (language: string) => void
  setGenerationMode: (mode: GenerationMode) => void
  setTemplateId: (templateId: string) => void

  // Requirements tracking
  addRequirement: (requirement: Omit<Requirement, 'id'>) => void
  updateRequirement: (id: string, updates: Partial<Requirement>) => void
  removeRequirement: (id: string) => void

  // Decision tracking
  addDecision: (decision: Omit<Decision, 'id' | 'timestamp'>) => void
  updateDecision: (id: string, updates: Partial<Decision>) => void
  removeDecision: (id: string) => void

  // Generated files tracking
  addGeneratedFile: (file: Omit<GeneratedFile, 'lastGenerated' | 'lastModified'>) => void
  updateGeneratedFile: (path: string, updates: Partial<GeneratedFile>) => void
  removeGeneratedFile: (path: string) => void

  // Git config
  setGitConfig: (config: Partial<GitConfig>) => void

  // Utility
  markDirty: () => void
  clearError: () => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      project: null,
      isDirty: false,
      isLoading: false,
      error: null,

      createProject: (rootPath: string, name?: string) => {
        const id = generateId()
        const project = createEmptyProject(id, rootPath, name)
        set({ project, isDirty: true, error: null })
      },

      loadProject: async (path: string) => {
        set({ isLoading: true, error: null })
        try {
          if (window.api?.project?.load) {
            const project = await window.api.project.load(path)
            set({ project, isDirty: false, isLoading: false })
          } else {
            throw new Error('Project API not available')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load project',
            isLoading: false,
          })
        }
      },

      saveProject: async () => {
        const { project } = get()
        if (!project) return

        set({ isLoading: true, error: null })
        try {
          const updatedProject = {
            ...project,
            updatedAt: new Date().toISOString(),
          }

          if (window.api?.project?.save) {
            await window.api.project.save(updatedProject)
            set({ project: updatedProject, isDirty: false, isLoading: false })
          } else {
            throw new Error('Project API not available')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to save project',
            isLoading: false,
          })
        }
      },

      closeProject: () => {
        set({ project: null, isDirty: false, error: null })
      },

      setProjectName: (name: string) => {
        const { project } = get()
        if (!project) return
        set({
          project: { ...project, name, updatedAt: new Date().toISOString() },
          isDirty: true,
        })
      },

      setTargetLanguage: (language: string) => {
        const { project } = get()
        if (!project) return
        set({
          project: { ...project, targetLanguage: language, updatedAt: new Date().toISOString() },
          isDirty: true,
        })
      },

      setGenerationMode: (mode: GenerationMode) => {
        const { project } = get()
        if (!project) return
        set({
          project: { ...project, generationMode: mode, updatedAt: new Date().toISOString() },
          isDirty: true,
        })
      },

      setTemplateId: (templateId: string) => {
        const { project } = get()
        if (!project) return
        set({
          project: { ...project, templateId, updatedAt: new Date().toISOString() },
          isDirty: true,
        })
      },

      // Requirements tracking
      addRequirement: (requirement) => {
        const { project } = get()
        if (!project) return

        const newRequirement: Requirement = {
          ...requirement,
          id: generateId(),
        }

        set({
          project: {
            ...project,
            requirements: [...project.requirements, newRequirement],
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      updateRequirement: (id: string, updates: Partial<Requirement>) => {
        const { project } = get()
        if (!project) return

        set({
          project: {
            ...project,
            requirements: project.requirements.map((req) =>
              req.id === id ? { ...req, ...updates } : req
            ),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      removeRequirement: (id: string) => {
        const { project } = get()
        if (!project) return

        set({
          project: {
            ...project,
            requirements: project.requirements.filter((req) => req.id !== id),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      // Decision tracking
      addDecision: (decision) => {
        const { project } = get()
        if (!project) return

        const newDecision: Decision = {
          ...decision,
          id: generateId(),
          timestamp: new Date().toISOString(),
        }

        set({
          project: {
            ...project,
            decisions: [...project.decisions, newDecision],
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      updateDecision: (id: string, updates: Partial<Decision>) => {
        const { project } = get()
        if (!project) return

        set({
          project: {
            ...project,
            decisions: project.decisions.map((dec) =>
              dec.id === id ? { ...dec, ...updates } : dec
            ),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      removeDecision: (id: string) => {
        const { project } = get()
        if (!project) return

        set({
          project: {
            ...project,
            decisions: project.decisions.filter((dec) => dec.id !== id),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      // Generated files tracking
      addGeneratedFile: (file) => {
        const { project } = get()
        if (!project) return

        const now = new Date().toISOString()
        const newFile: GeneratedFile = {
          ...file,
          lastGenerated: now,
          lastModified: now,
        }

        set({
          project: {
            ...project,
            generatedFiles: [...project.generatedFiles, newFile],
            updatedAt: now,
          },
          isDirty: true,
        })
      },

      updateGeneratedFile: (path: string, updates: Partial<GeneratedFile>) => {
        const { project } = get()
        if (!project) return

        set({
          project: {
            ...project,
            generatedFiles: project.generatedFiles.map((file) =>
              file.path === path ? { ...file, ...updates, lastModified: new Date().toISOString() } : file
            ),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      removeGeneratedFile: (path: string) => {
        const { project } = get()
        if (!project) return

        set({
          project: {
            ...project,
            generatedFiles: project.generatedFiles.filter((file) => file.path !== path),
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      // Git config
      setGitConfig: (config: Partial<GitConfig>) => {
        const { project } = get()
        if (!project) return

        set({
          project: {
            ...project,
            gitConfig: { ...project.gitConfig, ...config },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      // Utility
      markDirty: () => {
        set({ isDirty: true })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'spec-planner-project',
      partialize: (state) => ({
        project: state.project,
      }),
    }
  )
)

/**
 * Context format expected by ContextBuilder
 */
interface ProjectContextForClaude {
  projectId: string
  projectName: string
  rootPath: string
  targetLanguage: string
  generationMode: GenerationMode
  requirements: { category: string; items: string[] }[]
  decisions: { topic: string; choice: string }[]
  existingSpecs: { path: string; title: string; status: 'draft' | 'complete' }[]
}

/**
 * Selector: Get project context for Claude messages
 * Converts ProjectState to the format expected by the Claude service
 */
export function getProjectContext(
  project: ProjectState | null
): ProjectContextForClaude | undefined {
  if (!project) return undefined

  return {
    projectId: project.id,
    projectName: project.name,
    rootPath: project.rootPath,
    targetLanguage: project.targetLanguage,
    generationMode: project.generationMode,
    requirements: groupRequirementsByCategory(project.requirements),
    decisions: project.decisions.map((d) => ({
      topic: d.topic,
      choice: d.choice,
    })),
    existingSpecs: project.generatedFiles.map((f) => ({
      path: f.path,
      title: extractTitleFromPath(f.path),
      status: f.status === 'draft' ? ('draft' as const) : ('complete' as const),
    })),
  }
}

/**
 * Group requirements by category for context building
 */
function groupRequirementsByCategory(
  requirements: Requirement[]
): { category: string; items: string[] }[] {
  const groups: Record<string, string[]> = {}

  for (const req of requirements) {
    const category = req.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(req.description)
  }

  return Object.entries(groups).map(([category, items]) => ({
    category,
    items,
  }))
}

/**
 * Extract a title from a file path
 */
function extractTitleFromPath(path: string): string {
  const fileName = path.split('/').pop() ?? path
  const baseName = fileName.replace(/\.[^/.]+$/, '')
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
