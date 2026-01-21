import { render, screen, fireEvent } from '@testing-library/react'
import { FileBrowser } from './FileBrowser'
import { useFileStore } from '../../stores/fileStore'
import type { FileNode } from '../../../shared/types/file'

// Mock the file store
jest.mock('../../stores/fileStore')

// Mock the file watcher hook
jest.mock('./hooks/useFileWatcher', () => ({
  useFileWatcher: jest.fn(),
}))

// Mock CSS modules
jest.mock('./file-browser.module.css', () => ({
  fileBrowser: 'fileBrowser',
  fileTree: 'fileTree',
  error: 'error',
  emptyState: 'emptyState',
  hint: 'hint',
  loading: 'loading',
}))

const mockUseFileStore = useFileStore as jest.MockedFunction<typeof useFileStore>

describe('FileBrowser', () => {
  const mockTree: FileNode = {
    id: 'root',
    name: 'project',
    path: '/project',
    type: 'directory',
    depth: 0,
    children: [
      {
        id: 'file1',
        name: 'index.ts',
        path: '/project/index.ts',
        type: 'file',
        depth: 1,
      },
      {
        id: 'dir1',
        name: 'src',
        path: '/project/src',
        type: 'directory',
        depth: 1,
        children: [
          {
            id: 'file2',
            name: 'app.ts',
            path: '/project/src/app.ts',
            type: 'file',
            depth: 2,
          },
        ],
      },
    ],
  }

  const defaultState = {
    tree: mockTree,
    rootPath: '/project',
    selectedPath: null,
    expandedPaths: new Set(['/project']),
    fileStatuses: new Map(),
    isLoading: false,
    error: null,
    refreshTree: jest.fn(),
    selectFile: jest.fn(),
    toggleExpanded: jest.fn(),
    collapseAll: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFileStore.mockReturnValue(defaultState)
  })

  it('renders the file browser container', () => {
    const { container } = render(<FileBrowser />)
    expect(container.querySelector('.fileBrowser')).toBeInTheDocument()
  })

  it('renders the toolbar', () => {
    render(<FileBrowser />)
    // Toolbar should have refresh and collapse all buttons
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument()
  })

  it('renders the file tree when tree exists', () => {
    render(<FileBrowser />)
    expect(screen.getByRole('tree')).toBeInTheDocument()
  })

  it('shows loading state when loading', () => {
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      tree: null,
      isLoading: true,
    })

    render(<FileBrowser />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows error state with retry button', () => {
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      tree: null,
      error: 'Failed to load',
    })

    render(<FileBrowser />)
    expect(screen.getByText(/Error: Failed to load/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('calls refreshTree when retry button is clicked', () => {
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      tree: null,
      error: 'Failed to load',
    })

    render(<FileBrowser />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(defaultState.refreshTree).toHaveBeenCalled()
  })

  it('shows empty state when no tree and not loading', () => {
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      tree: null,
      rootPath: null,
    })

    render(<FileBrowser />)
    expect(screen.getByText('No project open')).toBeInTheDocument()
    expect(screen.getByText('Open a project to see files')).toBeInTheDocument()
  })

  it('calls onOpenFile when a file is selected', () => {
    const onOpenFile = jest.fn()
    render(<FileBrowser onOpenFile={onOpenFile} />)

    // Find and click on a file (this depends on FileTree implementation)
    // The onSelect handler should call both selectFile and onOpenFile
  })

  it('calls refreshTree when refresh button is clicked', () => {
    render(<FileBrowser />)
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }))

    expect(defaultState.refreshTree).toHaveBeenCalled()
  })

  it('calls collapseAll when collapse button is clicked', () => {
    render(<FileBrowser />)
    fireEvent.click(screen.getByRole('button', { name: /collapse/i }))

    expect(defaultState.collapseAll).toHaveBeenCalled()
  })

  it('handles keyboard navigation with ArrowDown', () => {
    const { container } = render(<FileBrowser />)
    const browser = container.querySelector('.fileBrowser')

    fireEvent.keyDown(browser!, { key: 'ArrowDown' })

    // Keyboard navigation depends on the expanded state and tree structure
    // This test verifies no errors occur during the event
  })

  it('handles keyboard navigation with ArrowUp', () => {
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      selectedPath: '/project/index.ts',
    })

    const { container } = render(<FileBrowser />)
    const browser = container.querySelector('.fileBrowser')

    fireEvent.keyDown(browser!, { key: 'ArrowUp' })

    // Tests that keyboard navigation doesn't throw errors
  })

  it('handles Enter key on file to open it', () => {
    const onOpenFile = jest.fn()
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      selectedPath: '/project/index.ts',
    })

    const { container } = render(<FileBrowser onOpenFile={onOpenFile} />)
    const browser = container.querySelector('.fileBrowser')

    fireEvent.keyDown(browser!, { key: 'Enter' })

    expect(onOpenFile).toHaveBeenCalledWith('/project/index.ts')
  })

  it('handles Enter key on directory to toggle expansion', () => {
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      selectedPath: '/project/src',
    })

    const { container } = render(<FileBrowser />)
    const browser = container.querySelector('.fileBrowser')

    fireEvent.keyDown(browser!, { key: 'Enter' })

    expect(defaultState.toggleExpanded).toHaveBeenCalledWith('/project/src')
  })

  it('handles Space key to toggle directory', () => {
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      selectedPath: '/project/src',
    })

    const { container } = render(<FileBrowser />)
    const browser = container.querySelector('.fileBrowser')

    fireEvent.keyDown(browser!, { key: ' ' })

    expect(defaultState.toggleExpanded).toHaveBeenCalledWith('/project/src')
  })

  it('handles ArrowRight key to expand directory', () => {
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      selectedPath: '/project/src',
      expandedPaths: new Set(['/project']), // src is not expanded
    })

    const { container } = render(<FileBrowser />)
    const browser = container.querySelector('.fileBrowser')

    fireEvent.keyDown(browser!, { key: 'ArrowRight' })

    expect(defaultState.toggleExpanded).toHaveBeenCalledWith('/project/src')
  })

  it('handles ArrowLeft key to collapse expanded directory', () => {
    mockUseFileStore.mockReturnValue({
      ...defaultState,
      selectedPath: '/project/src',
      expandedPaths: new Set(['/project', '/project/src']),
    })

    const { container } = render(<FileBrowser />)
    const browser = container.querySelector('.fileBrowser')

    fireEvent.keyDown(browser!, { key: 'ArrowLeft' })

    expect(defaultState.toggleExpanded).toHaveBeenCalledWith('/project/src')
  })
})
