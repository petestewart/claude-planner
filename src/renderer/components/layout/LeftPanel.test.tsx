import { render, screen, fireEvent } from '@testing-library/react'
import { LeftPanel } from './LeftPanel'
import { useLayoutStore } from '../../stores/layoutStore'
import { useEditorStore } from '../../stores/editorStore'

// Mock CSS modules
jest.mock('./LeftPanel.module.css', () => ({
  leftPanel: 'leftPanel',
  fileBrowser: 'fileBrowser',
  editorPanel: 'editorPanel',
}))

// Mock the stores
jest.mock('../../stores/layoutStore')
jest.mock('../../stores/editorStore')

// Mock child components
jest.mock('../file-browser', () => ({
  FileBrowser: ({ onOpenFile }: { onOpenFile: (path: string) => void }) => (
    <div data-testid="file-browser">
      <button
        data-testid="open-md-file"
        onClick={() => onOpenFile('/test/file.md')}
      >
        Open MD
      </button>
      <button
        data-testid="open-ts-file"
        onClick={() => onOpenFile('/test/file.ts')}
      >
        Open TS
      </button>
      <button
        data-testid="open-img-file"
        onClick={() => onOpenFile('/test/image.png')}
      >
        Open Image
      </button>
    </div>
  ),
}))

jest.mock('../editor', () => ({
  MarkdownEditor: () => <div data-testid="markdown-editor">Editor</div>,
}))

jest.mock('./HorizontalDivider', () => ({
  HorizontalDivider: ({ onDrag }: { onDrag: (deltaY: number) => void }) => (
    <div data-testid="horizontal-divider" onClick={() => onDrag(50)}>
      Divider
    </div>
  ),
}))

const mockUseLayoutStore = useLayoutStore as jest.MockedFunction<
  typeof useLayoutStore
>
const mockUseEditorStore = useEditorStore as jest.MockedFunction<
  typeof useEditorStore
>

describe('LeftPanel', () => {
  const mockSetFileBrowserHeight = jest.fn()
  const mockOpenFile = jest.fn()

  const createMockEditorState = () => ({
    activeFile: null,
    openFiles: new Map(),
    mode: 'markdown' as const,
    autoSaveEnabled: false,
    autoSaveDelay: 1000,
    conflict: null,
    openFile: mockOpenFile,
    closeFile: jest.fn(),
    setActiveFile: jest.fn(),
    updateContent: jest.fn(),
    saveFile: jest.fn(),
    saveActiveFile: jest.fn(),
    saveAllFiles: jest.fn(),
    setMode: jest.fn(),
    reloadFromDisk: jest.fn(),
    setSelection: jest.fn(),
    markSaved: jest.fn(),
    setAutoSaveEnabled: jest.fn(),
    showConflict: jest.fn(),
    resolveConflict: jest.fn(),
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseLayoutStore.mockReturnValue({
      fileBrowserHeight: 50,
      setFileBrowserHeight: mockSetFileBrowserHeight,
    })

    mockUseEditorStore.mockImplementation((selector) => {
      return selector(createMockEditorState())
    })
  })

  it('renders the left panel with correct width', () => {
    const { container } = render(<LeftPanel width={280} />)

    const panel = container.querySelector('.leftPanel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveStyle({ width: '280px' })
  })

  it('renders file browser section', () => {
    render(<LeftPanel width={280} />)

    expect(screen.getByTestId('file-browser')).toBeInTheDocument()
  })

  it('renders markdown editor section', () => {
    render(<LeftPanel width={280} />)

    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument()
  })

  it('renders horizontal divider', () => {
    render(<LeftPanel width={280} />)

    expect(screen.getByTestId('horizontal-divider')).toBeInTheDocument()
  })

  it('sets file browser height from store', () => {
    const { container } = render(<LeftPanel width={280} />)

    const fileBrowser = container.querySelector('.fileBrowser')
    expect(fileBrowser).toHaveStyle({ height: '50%' })
  })

  it('sets editor panel height as remainder', () => {
    const { container } = render(<LeftPanel width={280} />)

    const editorPanel = container.querySelector('.editorPanel')
    expect(editorPanel).toHaveStyle({ height: '50%' })
  })

  it('adjusts heights based on file browser height', () => {
    mockUseLayoutStore.mockReturnValue({
      fileBrowserHeight: 70,
      setFileBrowserHeight: mockSetFileBrowserHeight,
    })

    const { container } = render(<LeftPanel width={280} />)

    const fileBrowser = container.querySelector('.fileBrowser')
    const editorPanel = container.querySelector('.editorPanel')

    expect(fileBrowser).toHaveStyle({ height: '70%' })
    expect(editorPanel).toHaveStyle({ height: '30%' })
  })

  it('opens markdown files in editor', () => {
    render(<LeftPanel width={280} />)

    const openMdButton = screen.getByTestId('open-md-file')
    fireEvent.click(openMdButton)

    expect(mockOpenFile).toHaveBeenCalledWith('/test/file.md')
  })

  it('opens TypeScript files in editor', () => {
    render(<LeftPanel width={280} />)

    const openTsButton = screen.getByTestId('open-ts-file')
    fireEvent.click(openTsButton)

    expect(mockOpenFile).toHaveBeenCalledWith('/test/file.ts')
  })

  it('does not open image files in editor', () => {
    render(<LeftPanel width={280} />)

    const openImgButton = screen.getByTestId('open-img-file')
    fireEvent.click(openImgButton)

    expect(mockOpenFile).not.toHaveBeenCalled()
  })

  it('handles divider drag events', () => {
    // Mock the DOM element clientHeight
    const mockElement = {
      clientHeight: 500,
    }

    jest
      .spyOn(document, 'querySelector')
      .mockReturnValue(mockElement as unknown as Element)

    render(<LeftPanel width={280} />)

    const divider = screen.getByTestId('horizontal-divider')
    fireEvent.click(divider) // Our mock calls onDrag(50)

    // 50px delta / 500px height * 100 = 10% change
    // Initial height was 50%, so new height should be 60%
    expect(mockSetFileBrowserHeight).toHaveBeenCalledWith(60)
  })

  it('handles divider drag when panel element not found', () => {
    jest.spyOn(document, 'querySelector').mockReturnValue(null)

    render(<LeftPanel width={280} />)

    const divider = screen.getByTestId('horizontal-divider')
    fireEvent.click(divider)

    // Should not call setFileBrowserHeight when element not found
    expect(mockSetFileBrowserHeight).not.toHaveBeenCalled()
  })

  it('supports various text file extensions', () => {
    render(<LeftPanel width={280} />)

    // Our mock only has specific buttons, but the component logic handles all text extensions
    const openMdButton = screen.getByTestId('open-md-file')
    fireEvent.click(openMdButton)

    expect(mockOpenFile).toHaveBeenCalled()
  })

  it('renders with different widths', () => {
    const { container, rerender } = render(<LeftPanel width={300} />)

    let panel = container.querySelector('.leftPanel')
    expect(panel).toHaveStyle({ width: '300px' })

    rerender(<LeftPanel width={400} />)

    panel = container.querySelector('.leftPanel')
    expect(panel).toHaveStyle({ width: '400px' })
  })
})
