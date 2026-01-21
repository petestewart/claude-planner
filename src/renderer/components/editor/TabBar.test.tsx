import { render, screen, fireEvent } from '@testing-library/react'
import { TabBar } from './TabBar'

// Mock CSS modules
jest.mock('./editor.module.css', () => ({
  tabBar: 'tabBar',
  tab: 'tab',
  'tab--active': 'tab--active',
  tabName: 'tabName',
  tabDirtyIndicator: 'tabDirtyIndicator',
  tabCloseButton: 'tabCloseButton',
}))

describe('TabBar', () => {
  const defaultFiles = [
    { path: '/project/index.ts', name: 'index.ts', isDirty: false },
    { path: '/project/app.ts', name: 'app.ts', isDirty: false },
    { path: '/project/utils.ts', name: 'utils.ts', isDirty: true },
  ]

  const defaultProps = {
    files: defaultFiles,
    activePath: '/project/index.ts',
    onTabClick: jest.fn(),
    onTabClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all tabs', () => {
    render(<TabBar {...defaultProps} />)

    expect(screen.getByText('index.ts')).toBeInTheDocument()
    expect(screen.getByText('app.ts')).toBeInTheDocument()
    expect(screen.getByText('utils.ts')).toBeInTheDocument()
  })

  it('renders empty tabBar when no files', () => {
    const props = { ...defaultProps, files: [] }
    const { container } = render(<TabBar {...props} />)

    expect(container.querySelector('.tabBar')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('marks active tab with correct aria-selected', () => {
    render(<TabBar {...defaultProps} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('applies active class to active tab', () => {
    render(<TabBar {...defaultProps} />)

    const activeTab = screen.getByText('index.ts').closest('.tab')
    expect(activeTab).toHaveClass('tab--active')
  })

  it('shows dirty indicator for dirty files', () => {
    render(<TabBar {...defaultProps} />)

    const dirtyTab = screen.getByText('utils.ts').closest('.tab')
    const dirtyIndicator = dirtyTab?.querySelector('.tabDirtyIndicator')
    expect(dirtyIndicator).toBeInTheDocument()
    expect(dirtyIndicator).toHaveAttribute('title', 'Unsaved changes')
  })

  it('does not show dirty indicator for clean files', () => {
    render(<TabBar {...defaultProps} />)

    const cleanTab = screen.getByText('index.ts').closest('.tab')
    const dirtyIndicator = cleanTab?.querySelector('.tabDirtyIndicator')
    expect(dirtyIndicator).not.toBeInTheDocument()
  })

  it('calls onTabClick when tab is clicked', () => {
    render(<TabBar {...defaultProps} />)

    fireEvent.click(screen.getByText('app.ts'))

    expect(defaultProps.onTabClick).toHaveBeenCalledWith('/project/app.ts')
  })

  it('calls onTabClose when close button is clicked', () => {
    render(<TabBar {...defaultProps} />)

    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    expect(closeButtons.length).toBeGreaterThan(1)
    fireEvent.click(closeButtons[1]!) // Close app.ts

    expect(defaultProps.onTabClose).toHaveBeenCalledWith('/project/app.ts')
  })

  it('does not call onTabClick when close button is clicked', () => {
    render(<TabBar {...defaultProps} />)

    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    expect(closeButtons.length).toBeGreaterThan(0)
    fireEvent.click(closeButtons[0]!)

    // onTabClose should be called, but not onTabClick
    expect(defaultProps.onTabClose).toHaveBeenCalled()
    expect(defaultProps.onTabClick).not.toHaveBeenCalled()
  })

  it('sets tab title to full path', () => {
    render(<TabBar {...defaultProps} />)

    const tab = screen.getByText('index.ts').closest('.tab')
    expect(tab).toHaveAttribute('title', '/project/index.ts')
  })

  it('close button has correct aria-label', () => {
    render(<TabBar {...defaultProps} />)

    expect(
      screen.getByRole('button', { name: 'Close index.ts' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Close app.ts' })
    ).toBeInTheDocument()
  })

  it('handles single file', () => {
    const props = {
      ...defaultProps,
      files: [{ path: '/project/only.ts', name: 'only.ts', isDirty: false }],
      activePath: '/project/only.ts',
    }

    render(<TabBar {...props} />)

    expect(screen.getByText('only.ts')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(1)
  })

  it('handles no active path', () => {
    const props = { ...defaultProps, activePath: null }

    render(<TabBar {...props} />)

    const tabs = screen.getAllByRole('tab')
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-selected', 'false')
    })
  })

  it('handles active path not in files list', () => {
    const props = { ...defaultProps, activePath: '/project/nonexistent.ts' }

    render(<TabBar {...props} />)

    const tabs = screen.getAllByRole('tab')
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-selected', 'false')
    })
  })
})
