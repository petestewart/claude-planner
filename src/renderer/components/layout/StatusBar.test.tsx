import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StatusBar } from './StatusBar'
import { useProjectStore } from '../../stores/projectStore'

// Mock the stores and components
jest.mock('../../stores/projectStore')
jest.mock('../git', () => ({
  GitStatusIndicator: ({
    autoCommitEnabled,
    onAutoCommitChange,
    showDetails,
  }: {
    autoCommitEnabled: boolean
    onAutoCommitChange: (enabled: boolean) => void
    showDetails: boolean
  }) => (
    <div data-testid="git-status-indicator">
      <span>Git Status</span>
      <span>Auto-commit: {autoCommitEnabled ? 'on' : 'off'}</span>
      <button onClick={() => onAutoCommitChange(!autoCommitEnabled)}>
        Toggle Auto-commit
      </button>
      {showDetails && <span>Details</span>}
    </div>
  ),
}))

// Mock CSS module
jest.mock('./StatusBar.module.css', () => ({
  statusBar: 'statusBar',
  left: 'left',
  center: 'center',
  right: 'right',
  item: 'item',
  indicator: 'indicator',
  projectPath: 'projectPath',
  folderIcon: 'folderIcon',
}))

const mockUseProjectStore = useProjectStore as jest.MockedFunction<
  typeof useProjectStore
>

describe('StatusBar', () => {
  const mockSetGitConfig = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseProjectStore.mockImplementation((selector) => {
      const state = {
        project: {
          gitConfig: { autoCommit: false },
        },
        setGitConfig: mockSetGitConfig,
      }
      return selector ? selector(state as never) : state
    })
  })

  it('renders the status bar footer', () => {
    render(<StatusBar />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('shows disconnected status by default', () => {
    render(<StatusBar />)
    expect(screen.getByText('Claude disconnected')).toBeInTheDocument()
  })

  it('shows connected status when claudeStatus is connected', () => {
    render(<StatusBar claudeStatus="connected" />)
    expect(screen.getByText('Connected to Claude')).toBeInTheDocument()
  })

  it('shows error status when claudeStatus is error', () => {
    render(<StatusBar claudeStatus="error" />)
    expect(screen.getByText('Claude error')).toBeInTheDocument()
  })

  it('does not show git status indicator when gitEnabled is false', () => {
    render(<StatusBar gitEnabled={false} />)
    expect(screen.queryByTestId('git-status-indicator')).not.toBeInTheDocument()
  })

  it('shows git status indicator when gitEnabled is true', () => {
    render(<StatusBar gitEnabled={true} />)
    expect(screen.getByTestId('git-status-indicator')).toBeInTheDocument()
  })

  it('does not show cursor position when not provided', () => {
    render(<StatusBar />)
    expect(screen.queryByText(/Ln.*Col/)).not.toBeInTheDocument()
  })

  it('shows cursor position when both cursorPosition and currentFile are provided', () => {
    render(
      <StatusBar
        cursorPosition={{ line: 10, column: 5 }}
        currentFile="/test/file.md"
      />
    )
    expect(screen.getByText('Ln 10, Col 5')).toBeInTheDocument()
  })

  it('does not show cursor position when only cursorPosition is provided', () => {
    render(<StatusBar cursorPosition={{ line: 10, column: 5 }} />)
    expect(screen.queryByText(/Ln.*Col/)).not.toBeInTheDocument()
  })

  it('handles auto-commit toggle', async () => {
    const mockGitSetAutoCommit = window.api.git.setAutoCommit as jest.Mock
    mockGitSetAutoCommit.mockResolvedValue({ success: true })

    render(<StatusBar gitEnabled={true} />)

    const toggleButton = screen.getByRole('button', {
      name: /toggle auto-commit/i,
    })
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(mockSetGitConfig).toHaveBeenCalledWith({ autoCommit: true })
    })

    await waitFor(() => {
      expect(mockGitSetAutoCommit).toHaveBeenCalledWith(true)
    })
  })

  it('handles auto-commit toggle error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const mockGitSetAutoCommit = window.api.git.setAutoCommit as jest.Mock
    mockGitSetAutoCommit.mockRejectedValue(new Error('Failed'))

    render(<StatusBar gitEnabled={true} />)

    const toggleButton = screen.getByRole('button', {
      name: /toggle auto-commit/i,
    })
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to set auto-commit:',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('uses autoCommit from gitConfig when available', () => {
    mockUseProjectStore.mockImplementation((selector) => {
      const state = {
        project: {
          gitConfig: { autoCommit: true },
        },
        setGitConfig: mockSetGitConfig,
      }
      return selector ? selector(state as never) : state
    })

    render(<StatusBar gitEnabled={true} />)
    expect(screen.getByText('Auto-commit: on')).toBeInTheDocument()
  })

  it('defaults autoCommit to false when gitConfig is not available', () => {
    mockUseProjectStore.mockImplementation((selector) => {
      const state = {
        project: null,
        setGitConfig: mockSetGitConfig,
      }
      return selector ? selector(state as never) : state
    })

    render(<StatusBar gitEnabled={true} />)
    expect(screen.getByText('Auto-commit: off')).toBeInTheDocument()
  })

  describe('project path display', () => {
    it('does not show project path when no project is loaded', () => {
      mockUseProjectStore.mockImplementation((selector) => {
        const state = {
          project: null,
          setGitConfig: mockSetGitConfig,
        }
        return selector ? selector(state as never) : state
      })

      render(<StatusBar />)
      expect(screen.queryByText(/📁/)).not.toBeInTheDocument()
    })

    it('shows formatted project path when project is loaded', () => {
      mockUseProjectStore.mockImplementation((selector) => {
        const state = {
          project: {
            rootPath: '/home/user/projects/my-app',
            gitConfig: { autoCommit: false },
          },
          setGitConfig: mockSetGitConfig,
        }
        return selector ? selector(state as never) : state
      })

      render(<StatusBar />)
      expect(screen.getByText('projects/my-app')).toBeInTheDocument()
    })

    it('shows full path as title attribute', () => {
      const fullPath = '/home/user/projects/my-app'
      mockUseProjectStore.mockImplementation((selector) => {
        const state = {
          project: {
            rootPath: fullPath,
            gitConfig: { autoCommit: false },
          },
          setGitConfig: mockSetGitConfig,
        }
        return selector ? selector(state as never) : state
      })

      render(<StatusBar />)
      // The title is on the span that contains both the folder icon and path text
      const pathContainer = screen.getByTitle(fullPath)
      expect(pathContainer).toBeInTheDocument()
      expect(pathContainer).toHaveTextContent('projects/my-app')
    })

    it('handles single-level paths', () => {
      mockUseProjectStore.mockImplementation((selector) => {
        const state = {
          project: {
            rootPath: '/root-folder',
            gitConfig: { autoCommit: false },
          },
          setGitConfig: mockSetGitConfig,
        }
        return selector ? selector(state as never) : state
      })

      render(<StatusBar />)
      expect(screen.getByText('root-folder')).toBeInTheDocument()
    })

    it('handles Windows-style paths', () => {
      mockUseProjectStore.mockImplementation((selector) => {
        const state = {
          project: {
            rootPath: 'C:\\Users\\dev\\projects\\my-app',
            gitConfig: { autoCommit: false },
          },
          setGitConfig: mockSetGitConfig,
        }
        return selector ? selector(state as never) : state
      })

      render(<StatusBar />)
      expect(screen.getByText('projects/my-app')).toBeInTheDocument()
    })
  })
})
