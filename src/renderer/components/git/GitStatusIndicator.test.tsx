import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { GitStatusIndicator } from './GitStatusIndicator'
import type { GitStatus } from '../../../main/services/git/types'

// Mock CSS module
jest.mock('./git.module.css', () => ({
  gitIndicator: 'gitIndicator',
  notRepo: 'notRepo',
  branchInfo: 'branchInfo',
  branchIcon: 'branchIcon',
  branchName: 'branchName',
  dirtyIndicator: 'dirtyIndicator',
  changeCounts: 'changeCounts',
  staged: 'staged',
  modified: 'modified',
  untracked: 'untracked',
  autoCommitToggle: 'autoCommitToggle',
  enabled: 'enabled',
  toggleLabel: 'toggleLabel',
  loadingDot: 'loadingDot',
}))

describe('GitStatusIndicator', () => {
  const defaultStatus: GitStatus = {
    isRepo: true,
    branch: 'main',
    staged: [],
    modified: [],
    untracked: [],
    isDirty: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(window.api.git.status as jest.Mock).mockResolvedValue(defaultStatus)
    ;(window.api.git.connect as jest.Mock).mockResolvedValue({ isRepo: true })
    ;(window.api.git.setAutoCommit as jest.Mock).mockResolvedValue({ success: true })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows "Not a git repository" when not connected', () => {
    render(<GitStatusIndicator />)
    expect(screen.getByText('Not a git repository')).toBeInTheDocument()
  })

  it('connects to repo via custom event', async () => {
    render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(window.api.git.connect).toHaveBeenCalledWith('/test/repo')
    })
  })

  it('shows branch name when connected', async () => {
    render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument()
    })
  })

  it('shows dirty indicator when there are uncommitted changes', async () => {
    const dirtyStatus: GitStatus = {
      ...defaultStatus,
      isDirty: true,
      modified: [{ path: 'test.ts', status: 'modified' }],
    }
    ;(window.api.git.status as jest.Mock).mockResolvedValue(dirtyStatus)

    render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(screen.getByTitle('Uncommitted changes')).toBeInTheDocument()
    })
  })

  it('shows change counts when showDetails is true', async () => {
    const statusWithChanges: GitStatus = {
      ...defaultStatus,
      staged: [{ path: 'staged.ts', status: 'added' }],
      modified: [{ path: 'modified.ts', status: 'modified' }],
      untracked: ['untracked.ts'],
    }
    ;(window.api.git.status as jest.Mock).mockResolvedValue(statusWithChanges)

    render(<GitStatusIndicator showDetails />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('+1')).toBeInTheDocument()
      expect(screen.getByText('~1')).toBeInTheDocument()
      expect(screen.getByText('?1')).toBeInTheDocument()
    })
  })

  it('does not show change counts when showDetails is false', async () => {
    const statusWithChanges: GitStatus = {
      ...defaultStatus,
      staged: [{ path: 'staged.ts', status: 'added' }],
    }
    ;(window.api.git.status as jest.Mock).mockResolvedValue(statusWithChanges)

    render(<GitStatusIndicator showDetails={false} />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument()
    })

    expect(screen.queryByText('+1')).not.toBeInTheDocument()
  })

  it('calls onAutoCommitChange when toggle is clicked', async () => {
    const onAutoCommitChange = jest.fn()

    render(
      <GitStatusIndicator
        autoCommitEnabled={false}
        onAutoCommitChange={onAutoCommitChange}
      />
    )

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(screen.getByTitle('Auto-commit disabled')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTitle('Auto-commit disabled'))

    expect(onAutoCommitChange).toHaveBeenCalledWith(true)
  })

  it('shows "Auto" label when auto-commit is enabled', async () => {
    render(<GitStatusIndicator autoCommitEnabled={true} />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Auto')).toBeInTheDocument()
    })
  })

  it('polls for status updates every 5 seconds', async () => {
    render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    // Initial call
    await waitFor(() => {
      expect(window.api.git.status).toHaveBeenCalledTimes(1)
    })

    // Advance timer
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(window.api.git.status).toHaveBeenCalledTimes(2)
    })
  })

  it('handles status fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(window.api.git.status as jest.Mock).mockRejectedValue(new Error('Failed'))

    render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get git status:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('handles connect error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(window.api.git.connect as jest.Mock).mockRejectedValue(new Error('Failed'))

    render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect to git repo:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('syncs auto-commit setting on connect', async () => {
    render(<GitStatusIndicator autoCommitEnabled={true} />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(window.api.git.setAutoCommit).toHaveBeenCalledWith(true)
    })
  })

  it('handles auto-commit sync error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(window.api.git.setAutoCommit as jest.Mock).mockRejectedValue(new Error('Failed'))

    render(<GitStatusIndicator autoCommitEnabled={true} />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to sync auto-commit setting:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('shows HEAD when branch is null', async () => {
    const statusNoBranch: GitStatus = {
      ...defaultStatus,
      branch: null,
    }
    ;(window.api.git.status as jest.Mock).mockResolvedValue(statusNoBranch)

    render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('HEAD')).toBeInTheDocument()
    })
  })

  it('cleans up event listeners on unmount', async () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalled()
    removeEventListenerSpy.mockRestore()
  })

  it('cleans up interval on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval')

    const { unmount } = render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('returns null indicator when status shows not a repo', async () => {
    ;(window.api.git.status as jest.Mock).mockResolvedValue({
      isRepo: false,
      branch: null,
      staged: [],
      modified: [],
      untracked: [],
      isDirty: false,
    })

    render(<GitStatusIndicator />)

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('git:connect', { detail: { cwd: '/test/repo' } })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Not a git repository')).toBeInTheDocument()
    })
  })
})
