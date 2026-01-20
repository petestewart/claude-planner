import * as fs from 'fs/promises'
import * as path from 'path'
import type { ProjectState } from '../../../shared/types/project'

/**
 * Name of the project state file
 */
const PROJECT_STATE_FILE = '.spec-planner.json'

/**
 * Load project state from a directory
 * @param rootPath - The project root directory
 * @returns The project state or null if not found
 */
export async function loadProjectState(rootPath: string): Promise<ProjectState> {
  const statePath = path.join(rootPath, PROJECT_STATE_FILE)

  try {
    const content = await fs.readFile(statePath, 'utf-8')
    const state = JSON.parse(content) as ProjectState

    // Ensure rootPath matches (in case project was moved)
    state.rootPath = rootPath

    return state
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      throw new ProjectServiceError(
        `No project found at ${rootPath}`,
        'NOT_FOUND'
      )
    }
    throw new ProjectServiceError(
      `Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'LOAD_ERROR'
    )
  }
}

/**
 * Save project state to disk
 * @param state - The project state to save
 */
export async function saveProjectState(state: ProjectState): Promise<void> {
  const statePath = path.join(state.rootPath, PROJECT_STATE_FILE)

  try {
    const content = JSON.stringify(state, null, 2)
    await fs.writeFile(statePath, content, 'utf-8')
  } catch (error) {
    throw new ProjectServiceError(
      `Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SAVE_ERROR'
    )
  }
}

/**
 * Check if a project exists in a directory
 * @param rootPath - The project root directory
 * @returns True if a project state file exists
 */
export async function projectExists(rootPath: string): Promise<boolean> {
  const statePath = path.join(rootPath, PROJECT_STATE_FILE)

  try {
    await fs.access(statePath)
    return true
  } catch {
    return false
  }
}

/**
 * Create a new project in a directory
 * @param rootPath - The project root directory
 * @param name - The project name
 * @returns The newly created project state
 */
export async function createProject(
  rootPath: string,
  name: string
): Promise<ProjectState> {
  const now = new Date().toISOString()
  const state: ProjectState = {
    id: generateProjectId(),
    rootPath,
    name,
    targetLanguage: 'TypeScript',
    templateId: 'standard',
    requirements: [],
    decisions: [],
    generatedFiles: [],
    generationMode: 'incremental',
    gitConfig: {
      enabled: true,
      autoCommit: false,
      initialized: false,
    },
    createdAt: now,
    updatedAt: now,
  }

  await saveProjectState(state)
  return state
}

/**
 * Generate a unique project ID
 */
function generateProjectId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Error codes for project service errors
 */
export type ProjectErrorCode =
  | 'NOT_FOUND'
  | 'LOAD_ERROR'
  | 'SAVE_ERROR'
  | 'ALREADY_EXISTS'

/**
 * Project service errors
 */
export class ProjectServiceError extends Error {
  constructor(
    message: string,
    public code: ProjectErrorCode
  ) {
    super(message)
    this.name = 'ProjectServiceError'
  }
}
