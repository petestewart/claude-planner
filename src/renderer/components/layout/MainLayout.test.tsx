import { render, screen } from '@testing-library/react'
import { MainLayout } from './MainLayout'
import { useLayoutStore } from '../../stores/layoutStore'

// Mock the layout store
jest.mock('../../stores/layoutStore')

// Mock child components
jest.mock('./LeftPanel', () => ({
  LeftPanel: ({ width }: { width: number }) => (
    <div data-testid="left-panel" data-width={width}>
      Left Panel
    </div>
  ),
}))

jest.mock('./PanelResizer', () => ({
  PanelResizer: ({
    onResize,
    collapsed,
  }: {
    onResize: (delta: number) => void
    collapsed: boolean
  }) => (
    <div
      data-testid="panel-resizer"
      data-collapsed={collapsed}
      onClick={() => onResize(10)}
    >
      Resizer
    </div>
  ),
}))

jest.mock('./RightPanel', () => ({
  RightPanel: () => <div data-testid="right-panel">Right Panel</div>,
}))

// Mock CSS modules
jest.mock('./MainLayout.module.css', () => ({
  mainLayout: 'mainLayout',
}))

const mockUseLayoutStore = useLayoutStore as jest.MockedFunction<
  typeof useLayoutStore
>

describe('MainLayout', () => {
  const defaultState = {
    leftPanelWidth: 280,
    leftPanelCollapsed: false,
    setLeftPanelWidth: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLayoutStore.mockReturnValue(defaultState)
  })

  it('renders the main layout container', () => {
    const { container } = render(<MainLayout />)
    expect(container.querySelector('.mainLayout')).toBeInTheDocument()
  })

  it('renders all three main sections', () => {
    render(<MainLayout />)

    expect(screen.getByTestId('left-panel')).toBeInTheDocument()
    expect(screen.getByTestId('panel-resizer')).toBeInTheDocument()
    expect(screen.getByTestId('right-panel')).toBeInTheDocument()
  })

  it('passes correct width to LeftPanel', () => {
    render(<MainLayout />)

    const leftPanel = screen.getByTestId('left-panel')
    expect(leftPanel).toHaveAttribute('data-width', '280')
  })

  it('does not render LeftPanel when collapsed', () => {
    mockUseLayoutStore.mockReturnValue({
      ...defaultState,
      leftPanelCollapsed: true,
    })

    render(<MainLayout />)

    expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument()
  })

  it('passes collapsed state to PanelResizer', () => {
    mockUseLayoutStore.mockReturnValue({
      ...defaultState,
      leftPanelCollapsed: true,
    })

    render(<MainLayout />)

    const resizer = screen.getByTestId('panel-resizer')
    expect(resizer).toHaveAttribute('data-collapsed', 'true')
  })

  it('sets CSS variable for left panel width', () => {
    const { container } = render(<MainLayout />)

    const mainLayout = container.querySelector('.mainLayout') as HTMLElement
    expect(mainLayout.style.getPropertyValue('--current-left-panel-width')).toBe(
      '280px'
    )
  })

  it('sets CSS variable to 0 when collapsed', () => {
    mockUseLayoutStore.mockReturnValue({
      ...defaultState,
      leftPanelCollapsed: true,
    })

    const { container } = render(<MainLayout />)

    const mainLayout = container.querySelector('.mainLayout') as HTMLElement
    expect(mainLayout.style.getPropertyValue('--current-left-panel-width')).toBe(
      '0px'
    )
  })

  it('calls setLeftPanelWidth when resizer is used', () => {
    render(<MainLayout />)

    const resizer = screen.getByTestId('panel-resizer')
    resizer.click() // Our mock calls onResize(10)

    expect(defaultState.setLeftPanelWidth).toHaveBeenCalledWith(290) // 280 + 10
  })

  it('renders with different panel widths', () => {
    mockUseLayoutStore.mockReturnValue({
      ...defaultState,
      leftPanelWidth: 400,
    })

    render(<MainLayout />)

    const leftPanel = screen.getByTestId('left-panel')
    expect(leftPanel).toHaveAttribute('data-width', '400')
  })

  it('always renders PanelResizer even when collapsed', () => {
    mockUseLayoutStore.mockReturnValue({
      ...defaultState,
      leftPanelCollapsed: true,
    })

    render(<MainLayout />)

    expect(screen.getByTestId('panel-resizer')).toBeInTheDocument()
  })

  it('always renders RightPanel', () => {
    render(<MainLayout />)
    expect(screen.getByTestId('right-panel')).toBeInTheDocument()
  })
})
