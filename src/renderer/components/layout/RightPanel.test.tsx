import { render, screen } from '@testing-library/react'
import { RightPanel } from './RightPanel'
import { useProjectStore } from '../../stores/projectStore'
import { useSettingsStore } from '../../stores/settingsStore'

// Mock CSS modules
jest.mock('./RightPanel.module.css', () => ({
  rightPanel: 'rightPanel',
}))

// Mock the stores
jest.mock('../../stores/projectStore')
jest.mock('../../stores/settingsStore')

// Mock ChatInterface
jest.mock('../chat/ChatInterface', () => ({
  ChatInterface: ({
    projectId,
    workingDirectory,
    cliPath,
  }: {
    projectId?: string
    workingDirectory: string
    cliPath: string
  }) => (
    <div data-testid="chat-interface">
      <span data-testid="project-id">{projectId || 'none'}</span>
      <span data-testid="working-dir">{workingDirectory}</span>
      <span data-testid="cli-path">{cliPath}</span>
    </div>
  ),
}))

const mockUseProjectStore = useProjectStore as jest.MockedFunction<
  typeof useProjectStore
>
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<
  typeof useSettingsStore
>

describe('RightPanel', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockProjectState = (project: any = null) => ({
    project,
    isDirty: false,
    isLoading: false,
    error: null,
    createProject: jest.fn(),
    loadProject: jest.fn(),
    saveProject: jest.fn(),
    closeProject: jest.fn(),
    setProjectName: jest.fn(),
    setTargetLanguage: jest.fn(),
    setGenerationMode: jest.fn(),
    setTemplateId: jest.fn(),
    addRequirement: jest.fn(),
    updateRequirement: jest.fn(),
    removeRequirement: jest.fn(),
    addDecision: jest.fn(),
    updateDecision: jest.fn(),
    removeDecision: jest.fn(),
    addGeneratedFile: jest.fn(),
    updateGeneratedFile: jest.fn(),
    removeGeneratedFile: jest.fn(),
    setGitConfig: jest.fn(),
    markDirty: jest.fn(),
    clearError: jest.fn(),
  })

  const createMockSettingsState = (claudeCliPath = 'claude') => ({
    autoSaveDelay: 1000,
    claudeCliPath,
    claudeTimeout: 120,
    commitMessageTemplate: 'Auto: {action} {file}',
    customTemplatesPath: '',
    setAutoSaveDelay: jest.fn(),
    setClaudeCliPath: jest.fn(),
    setClaudeTimeout: jest.fn(),
    setCommitMessageTemplate: jest.fn(),
    setCustomTemplatesPath: jest.fn(),
    resetSettings: jest.fn(),
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseProjectStore.mockImplementation((selector) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selector(createMockProjectState() as any)
    })

    mockUseSettingsStore.mockImplementation((selector) => {
      return selector(createMockSettingsState())
    })
  })

  it('renders the right panel', () => {
    const { container } = render(<RightPanel />)

    const panel = container.querySelector('.rightPanel')
    expect(panel).toBeInTheDocument()
  })

  it('renders chat interface', () => {
    render(<RightPanel />)

    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
  })

  it('passes working directory as / when no project', () => {
    render(<RightPanel />)

    expect(screen.getByTestId('working-dir')).toHaveTextContent('/')
  })

  it('passes project root path as working directory', () => {
    mockUseProjectStore.mockImplementation((selector) => {
      return selector(
        createMockProjectState({
          id: 'test-project-id',
          rootPath: '/path/to/project',
          name: 'Test Project',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
      )
    })

    render(<RightPanel />)

    expect(screen.getByTestId('working-dir')).toHaveTextContent(
      '/path/to/project'
    )
  })

  it('passes project id when project exists', () => {
    mockUseProjectStore.mockImplementation((selector) => {
      return selector(
        createMockProjectState({
          id: 'test-project-id',
          rootPath: '/path/to/project',
          name: 'Test Project',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
      )
    })

    render(<RightPanel />)

    expect(screen.getByTestId('project-id')).toHaveTextContent(
      'test-project-id'
    )
  })

  it('does not pass project id when no project', () => {
    render(<RightPanel />)

    expect(screen.getByTestId('project-id')).toHaveTextContent('none')
  })

  it('uses full CLI path when settings has "claude"', () => {
    mockUseSettingsStore.mockImplementation((selector) => {
      return selector(createMockSettingsState('claude'))
    })

    render(<RightPanel />)

    expect(screen.getByTestId('cli-path')).toHaveTextContent(
      '/Users/petestewart/.local/bin/claude'
    )
  })

  it('uses custom CLI path when specified', () => {
    mockUseSettingsStore.mockImplementation((selector) => {
      return selector(createMockSettingsState('/custom/path/to/claude'))
    })

    render(<RightPanel />)

    expect(screen.getByTestId('cli-path')).toHaveTextContent(
      '/custom/path/to/claude'
    )
  })

  it('handles project without id', () => {
    mockUseProjectStore.mockImplementation((selector) => {
      return selector(
        createMockProjectState({
          rootPath: '/path/to/project',
          name: 'Test Project',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
      )
    })

    render(<RightPanel />)

    expect(screen.getByTestId('project-id')).toHaveTextContent('none')
    expect(screen.getByTestId('working-dir')).toHaveTextContent(
      '/path/to/project'
    )
  })
})
