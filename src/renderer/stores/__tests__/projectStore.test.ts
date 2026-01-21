import { useProjectStore, getProjectContext } from '../projectStore'
import type { ProjectState } from '../../../shared/types/project'

// Reset state before each test
beforeEach(() => {
  localStorage.clear()
  useProjectStore.setState({
    project: null,
    isDirty: false,
    isLoading: false,
    error: null,
  })
  jest.clearAllMocks()
})

describe('projectStore', () => {
  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useProjectStore.getState()

      expect(state.project).toBeNull()
      expect(state.isDirty).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('createProject', () => {
    it('creates a new project with default values', () => {
      useProjectStore.getState().createProject('/test/project', 'My Project')

      const state = useProjectStore.getState()
      expect(state.project).not.toBeNull()
      expect(state.project?.rootPath).toBe('/test/project')
      expect(state.project?.name).toBe('My Project')
      expect(state.project?.targetLanguage).toBe('TypeScript')
      expect(state.project?.templateId).toBe('standard')
      expect(state.project?.generationMode).toBe('incremental')
      expect(state.project?.requirements).toEqual([])
      expect(state.project?.decisions).toEqual([])
      expect(state.project?.generatedFiles).toEqual([])
      expect(state.isDirty).toBe(true)
    })

    it('uses default name if not provided', () => {
      useProjectStore.getState().createProject('/test/project')

      expect(useProjectStore.getState().project?.name).toBe('New Project')
    })

    it('generates unique ID', () => {
      useProjectStore.getState().createProject('/test/project1')
      const id1 = useProjectStore.getState().project?.id

      useProjectStore.getState().createProject('/test/project2')
      const id2 = useProjectStore.getState().project?.id

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
    })

    it('has git config with defaults', () => {
      useProjectStore.getState().createProject('/test/project')

      const gitConfig = useProjectStore.getState().project?.gitConfig
      expect(gitConfig?.enabled).toBe(true)
      expect(gitConfig?.autoCommit).toBe(false)
      expect(gitConfig?.initialized).toBe(false)
    })
  })

  describe('loadProject', () => {
    it('loads project from path', async () => {
      const mockProject: ProjectState = {
        id: 'loaded-id',
        rootPath: '/test/loaded',
        name: 'Loaded Project',
        targetLanguage: 'JavaScript',
        templateId: 'custom',
        requirements: [],
        decisions: [],
        generatedFiles: [],
        generationMode: 'all-at-once',
        gitConfig: { enabled: true, autoCommit: true, initialized: true },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }

      const mockLoad = window.api.project.load as jest.Mock
      mockLoad.mockResolvedValue(mockProject)

      await useProjectStore.getState().loadProject('/test/loaded')

      const state = useProjectStore.getState()
      expect(state.project).toEqual(mockProject)
      expect(state.isDirty).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('handles load errors', async () => {
      const mockLoad = window.api.project.load as jest.Mock
      mockLoad.mockRejectedValue(new Error('File not found'))

      await useProjectStore.getState().loadProject('/nonexistent')

      const state = useProjectStore.getState()
      expect(state.error).toBe('File not found')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('saveProject', () => {
    it('saves project and clears dirty flag', async () => {
      const mockSave = window.api.project.save as jest.Mock
      mockSave.mockResolvedValue(undefined)

      useProjectStore.getState().createProject('/test/project', 'Test')

      await useProjectStore.getState().saveProject()

      expect(mockSave).toHaveBeenCalled()
      expect(useProjectStore.getState().isDirty).toBe(false)
    })

    it('does nothing if no project', async () => {
      const mockSave = window.api.project.save as jest.Mock

      await useProjectStore.getState().saveProject()

      expect(mockSave).not.toHaveBeenCalled()
    })

    it('updates timestamp on save', async () => {
      const mockSave = window.api.project.save as jest.Mock
      mockSave.mockResolvedValue(undefined)

      useProjectStore.getState().createProject('/test/project')
      const originalUpdatedAt = useProjectStore.getState().project?.updatedAt

      // Wait a bit to ensure timestamp differs
      await new Promise((resolve) => setTimeout(resolve, 10))

      await useProjectStore.getState().saveProject()

      expect(useProjectStore.getState().project?.updatedAt).not.toBe(originalUpdatedAt)
    })
  })

  describe('closeProject', () => {
    it('clears project state', () => {
      useProjectStore.getState().createProject('/test/project')
      expect(useProjectStore.getState().project).not.toBeNull()

      useProjectStore.getState().closeProject()

      const state = useProjectStore.getState()
      expect(state.project).toBeNull()
      expect(state.isDirty).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('project settings', () => {
    beforeEach(() => {
      useProjectStore.getState().createProject('/test/project')
    })

    it('setProjectName updates name', () => {
      useProjectStore.getState().setProjectName('New Name')

      expect(useProjectStore.getState().project?.name).toBe('New Name')
      expect(useProjectStore.getState().isDirty).toBe(true)
    })

    it('setTargetLanguage updates language', () => {
      useProjectStore.getState().setTargetLanguage('Rust')

      expect(useProjectStore.getState().project?.targetLanguage).toBe('Rust')
    })

    it('setGenerationMode updates mode', () => {
      useProjectStore.getState().setGenerationMode('draft-then-refine')

      expect(useProjectStore.getState().project?.generationMode).toBe('draft-then-refine')
    })

    it('setTemplateId updates template', () => {
      useProjectStore.getState().setTemplateId('minimal')

      expect(useProjectStore.getState().project?.templateId).toBe('minimal')
    })

    it('does nothing if no project', () => {
      useProjectStore.getState().closeProject()

      useProjectStore.getState().setProjectName('Test')

      expect(useProjectStore.getState().project).toBeNull()
    })
  })

  describe('requirements tracking', () => {
    beforeEach(() => {
      useProjectStore.getState().createProject('/test/project')
    })

    it('addRequirement adds a new requirement', () => {
      useProjectStore.getState().addRequirement({
        description: 'User can login',
        category: 'functional',
        priority: 'must',
        source: 'user',
      })

      const requirements = useProjectStore.getState().project?.requirements
      expect(requirements).toHaveLength(1)
      expect(requirements?.[0]?.description).toBe('User can login')
      expect(requirements?.[0]?.category).toBe('functional')
      expect(requirements?.[0]?.id).toBeDefined()
    })

    it('updateRequirement updates an existing requirement', () => {
      useProjectStore.getState().addRequirement({
        description: 'Original',
        category: 'functional',
        priority: 'could',
        source: 'user',
      })

      const id = useProjectStore.getState().project?.requirements[0]?.id as string

      useProjectStore.getState().updateRequirement(id, {
        description: 'Updated',
        priority: 'must',
      })

      const req = useProjectStore.getState().project?.requirements[0]
      expect(req?.description).toBe('Updated')
      expect(req?.priority).toBe('must')
      expect(req?.category).toBe('functional') // unchanged
    })

    it('removeRequirement removes a requirement', () => {
      useProjectStore.getState().addRequirement({
        description: 'Test',
        category: 'constraint',
        priority: 'should',
        source: 'agent-inferred',
      })

      const id = useProjectStore.getState().project?.requirements[0]?.id as string
      useProjectStore.getState().removeRequirement(id)

      expect(useProjectStore.getState().project?.requirements).toHaveLength(0)
    })
  })

  describe('decision tracking', () => {
    beforeEach(() => {
      useProjectStore.getState().createProject('/test/project')
    })

    it('addDecision adds a new decision', () => {
      useProjectStore.getState().addDecision({
        topic: 'Database',
        choice: 'PostgreSQL',
        rationale: 'Better for complex queries',
      })

      const decisions = useProjectStore.getState().project?.decisions
      expect(decisions).toHaveLength(1)
      expect(decisions?.[0]?.topic).toBe('Database')
      expect(decisions?.[0]?.choice).toBe('PostgreSQL')
      expect(decisions?.[0]?.id).toBeDefined()
      expect(decisions?.[0]?.timestamp).toBeDefined()
    })

    it('updateDecision updates an existing decision', () => {
      useProjectStore.getState().addDecision({
        topic: 'Framework',
        choice: 'React',
        rationale: 'Team familiarity',
      })

      const id = useProjectStore.getState().project?.decisions[0]?.id as string

      useProjectStore.getState().updateDecision(id, {
        choice: 'Vue',
      })

      const decision = useProjectStore.getState().project?.decisions[0]
      expect(decision?.choice).toBe('Vue')
      expect(decision?.topic).toBe('Framework') // unchanged
    })

    it('removeDecision removes a decision', () => {
      useProjectStore.getState().addDecision({
        topic: 'Test',
        choice: 'Option A',
        rationale: 'Testing',
      })

      const id = useProjectStore.getState().project?.decisions[0]?.id as string
      useProjectStore.getState().removeDecision(id)

      expect(useProjectStore.getState().project?.decisions).toHaveLength(0)
    })
  })

  describe('generated files tracking', () => {
    beforeEach(() => {
      useProjectStore.getState().createProject('/test/project')
    })

    it('addGeneratedFile adds a new file', () => {
      useProjectStore.getState().addGeneratedFile({
        path: '/test/project/specs/auth.md',
        status: 'draft',
      })

      const files = useProjectStore.getState().project?.generatedFiles
      expect(files).toHaveLength(1)
      expect(files?.[0]?.path).toBe('/test/project/specs/auth.md')
      expect(files?.[0]?.status).toBe('draft')
      expect(files?.[0]?.lastGenerated).toBeDefined()
      expect(files?.[0]?.lastModified).toBeDefined()
    })

    it('updateGeneratedFile updates a file', () => {
      useProjectStore.getState().addGeneratedFile({
        path: '/test/project/specs/auth.md',
        status: 'draft',
      })

      useProjectStore.getState().updateGeneratedFile('/test/project/specs/auth.md', {
        status: 'approved',
      })

      const file = useProjectStore.getState().project?.generatedFiles[0]
      expect(file?.status).toBe('approved')
    })

    it('removeGeneratedFile removes a file', () => {
      useProjectStore.getState().addGeneratedFile({
        path: '/test/project/specs/auth.md',
        status: 'draft',
      })

      useProjectStore.getState().removeGeneratedFile('/test/project/specs/auth.md')

      expect(useProjectStore.getState().project?.generatedFiles).toHaveLength(0)
    })
  })

  describe('git config', () => {
    beforeEach(() => {
      useProjectStore.getState().createProject('/test/project')
    })

    it('setGitConfig updates git configuration', () => {
      useProjectStore.getState().setGitConfig({
        autoCommit: true,
        initialized: true,
      })

      const gitConfig = useProjectStore.getState().project?.gitConfig
      expect(gitConfig?.autoCommit).toBe(true)
      expect(gitConfig?.initialized).toBe(true)
      expect(gitConfig?.enabled).toBe(true) // unchanged
    })
  })

  describe('utility functions', () => {
    it('markDirty sets isDirty to true', () => {
      useProjectStore.setState({ isDirty: false })

      useProjectStore.getState().markDirty()

      expect(useProjectStore.getState().isDirty).toBe(true)
    })

    it('clearError clears error state', () => {
      useProjectStore.setState({ error: 'Some error' })

      useProjectStore.getState().clearError()

      expect(useProjectStore.getState().error).toBeNull()
    })
  })

  describe('getProjectContext', () => {
    it('returns undefined for null project', () => {
      expect(getProjectContext(null)).toBeUndefined()
    })

    it('transforms project state to context format', () => {
      const project: ProjectState = {
        id: 'test-id',
        rootPath: '/test/project',
        name: 'Test Project',
        targetLanguage: 'TypeScript',
        templateId: 'standard',
        requirements: [
          { id: '1', description: 'Login', category: 'functional', priority: 'must', source: 'user' },
          { id: '2', description: 'Logout', category: 'functional', priority: 'should', source: 'user' },
          { id: '3', description: 'List items', category: 'non-functional', priority: 'must', source: 'agent-inferred' },
        ],
        decisions: [{ id: '1', topic: 'DB', choice: 'PostgreSQL', rationale: 'test', timestamp: '' }],
        generatedFiles: [{ path: '/test/specs/auth-spec.md', status: 'draft', lastGenerated: '', lastModified: '' }],
        generationMode: 'incremental',
        gitConfig: { enabled: true, autoCommit: false, initialized: false },
        createdAt: '',
        updatedAt: '',
      }

      const context = getProjectContext(project)

      expect(context?.projectId).toBe('test-id')
      expect(context?.projectName).toBe('Test Project')
      expect(context?.rootPath).toBe('/test/project')
      expect(context?.targetLanguage).toBe('TypeScript')
      expect(context?.generationMode).toBe('incremental')

      // Requirements grouped by category
      expect(context?.requirements).toHaveLength(2)
      const functionalReqs = context?.requirements.find((r) => r.category === 'functional')
      expect(functionalReqs?.items).toEqual(['Login', 'Logout'])

      // Decisions
      expect(context?.decisions).toHaveLength(1)
      expect(context?.decisions[0]).toEqual({ topic: 'DB', choice: 'PostgreSQL' })

      // Existing specs
      expect(context?.existingSpecs).toHaveLength(1)
      expect(context?.existingSpecs[0]).toEqual({
        path: '/test/specs/auth-spec.md',
        title: 'Auth Spec',
        status: 'draft',
      })
    })
  })

  describe('persistence', () => {
    it('persists project to localStorage', () => {
      useProjectStore.getState().createProject('/test/project', 'Persisted Project')

      const stored = JSON.parse(localStorage.getItem('spec-planner-project') || '{}')
      expect(stored.state?.project?.name).toBe('Persisted Project')
    })
  })
})
