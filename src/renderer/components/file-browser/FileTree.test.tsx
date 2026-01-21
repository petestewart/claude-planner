import { render, screen, fireEvent } from '@testing-library/react'
import { FileTree } from './FileTree'
import type { FileNode, FileStatus } from '../../../shared/types/file'

// Mock CSS modules
jest.mock('./file-browser.module.css', () => ({}))

// Mock FileTreeNode component
jest.mock('./FileTreeNode', () => ({
  FileTreeNode: ({
    node,
    isSelected,
    isExpanded,
    status,
    onSelect,
    onToggle,
    onContextMenu,
    onDoubleClick,
  }: {
    node: FileNode
    isSelected: boolean
    isExpanded: boolean
    status: FileStatus
    onSelect: () => void
    onToggle: () => void
    onContextMenu: (event: React.MouseEvent) => void
    onDoubleClick: () => void
  }) => (
    <div
      data-testid={`node-${node.id}`}
      data-selected={isSelected}
      data-expanded={isExpanded}
      data-status={status}
      data-type={node.type}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      role="treeitem"
    >
      {node.name}
      <button data-testid={`toggle-${node.id}`} onClick={onToggle}>
        toggle
      </button>
    </div>
  ),
}))

describe('FileTree', () => {
  const mockRoot: FileNode = {
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

  const defaultProps = {
    root: mockRoot,
    selectedPath: null,
    expandedPaths: new Set(['/project']),
    fileStatuses: new Map<string, FileStatus>(),
    onSelect: jest.fn(),
    onToggle: jest.fn(),
    onContextMenu: jest.fn(),
    onOpenFile: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the tree container with correct role', () => {
    render(<FileTree {...defaultProps} />)
    expect(screen.getByRole('tree')).toBeInTheDocument()
  })

  it('renders root level children', () => {
    render(<FileTree {...defaultProps} />)

    expect(screen.getByText('index.ts')).toBeInTheDocument()
    expect(screen.getByText('src')).toBeInTheDocument()
  })

  it('renders nested children when parent is expanded', () => {
    const props = {
      ...defaultProps,
      expandedPaths: new Set(['/project', '/project/src']),
    }

    render(<FileTree {...props} />)

    expect(screen.getByText('app.ts')).toBeInTheDocument()
  })

  it('does not render nested children when parent is collapsed', () => {
    const props = {
      ...defaultProps,
      expandedPaths: new Set(['/project']), // src not expanded
    }

    render(<FileTree {...props} />)

    // app.ts should not be visible since src is collapsed
    expect(screen.queryByText('app.ts')).not.toBeInTheDocument()
  })

  it('passes correct isSelected prop', () => {
    const props = {
      ...defaultProps,
      selectedPath: '/project/index.ts',
    }

    render(<FileTree {...props} />)

    const selectedNode = screen.getByTestId('node-file1')
    expect(selectedNode).toHaveAttribute('data-selected', 'true')

    const unselectedNode = screen.getByTestId('node-dir1')
    expect(unselectedNode).toHaveAttribute('data-selected', 'false')
  })

  it('passes correct isExpanded prop for directories', () => {
    const props = {
      ...defaultProps,
      expandedPaths: new Set(['/project', '/project/src']),
    }

    render(<FileTree {...props} />)

    const expandedDir = screen.getByTestId('node-dir1')
    expect(expandedDir).toHaveAttribute('data-expanded', 'true')
  })

  it('passes correct status from fileStatuses map', () => {
    const statuses = new Map<string, FileStatus>([
      ['/project/index.ts', 'modified'],
    ])

    const props = {
      ...defaultProps,
      fileStatuses: statuses,
    }

    render(<FileTree {...props} />)

    const modifiedNode = screen.getByTestId('node-file1')
    expect(modifiedNode).toHaveAttribute('data-status', 'modified')
  })

  it('uses normal status when not in fileStatuses map', () => {
    render(<FileTree {...defaultProps} />)

    const normalNode = screen.getByTestId('node-file1')
    expect(normalNode).toHaveAttribute('data-status', 'normal')
  })

  it('calls onSelect with correct path when node is clicked', () => {
    render(<FileTree {...defaultProps} />)

    fireEvent.click(screen.getByText('index.ts'))

    expect(defaultProps.onSelect).toHaveBeenCalledWith('/project/index.ts')
  })

  it('calls onToggle with correct path when toggle is clicked', () => {
    render(<FileTree {...defaultProps} />)

    fireEvent.click(screen.getByTestId('toggle-dir1'))

    expect(defaultProps.onToggle).toHaveBeenCalledWith('/project/src')
  })

  it('calls onOpenFile with correct path on double click', () => {
    render(<FileTree {...defaultProps} />)

    fireEvent.doubleClick(screen.getByTestId('node-file1'))

    expect(defaultProps.onOpenFile).toHaveBeenCalledWith('/project/index.ts')
  })

  it('calls onContextMenu with correct arguments', () => {
    render(<FileTree {...defaultProps} />)

    const node = screen.getByTestId('node-file1')
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true })
    fireEvent(node, contextMenuEvent)

    expect(defaultProps.onContextMenu).toHaveBeenCalled()
  })

  it('wraps nested children in group role element', () => {
    const props = {
      ...defaultProps,
      expandedPaths: new Set(['/project', '/project/src']),
    }

    render(<FileTree {...props} />)

    const groups = screen.getAllByRole('group')
    expect(groups.length).toBeGreaterThan(0)
  })

  it('renders empty tree when root has no children', () => {
    const emptyRoot: FileNode = {
      id: 'empty-root',
      name: 'empty',
      path: '/empty',
      type: 'directory',
      depth: 0,
      children: [],
    }

    const props = {
      ...defaultProps,
      root: emptyRoot,
    }

    render(<FileTree {...props} />)

    const tree = screen.getByRole('tree')
    expect(tree.children.length).toBe(0)
  })

  it('renders empty tree when root children is undefined', () => {
    const rootWithoutChildren: FileNode = {
      id: 'root-no-children',
      name: 'no-children',
      path: '/no-children',
      type: 'directory',
      depth: 0,
    }

    const props = {
      ...defaultProps,
      root: rootWithoutChildren,
    }

    render(<FileTree {...props} />)

    const tree = screen.getByRole('tree')
    expect(tree).toBeInTheDocument()
  })
})
