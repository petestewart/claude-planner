import { render, screen, fireEvent } from '@testing-library/react'
import { PanelResizer } from './PanelResizer'
import { useLayoutStore } from '../../stores/layoutStore'

// Mock CSS modules
jest.mock('./PanelResizer.module.css', () => ({
  resizer: 'resizer',
  active: 'active',
  collapsed: 'collapsed',
  expandIcon: 'expandIcon',
}))

// Mock the layout store
jest.mock('../../stores/layoutStore')

const mockUseLayoutStore = useLayoutStore as jest.MockedFunction<
  typeof useLayoutStore
>

describe('PanelResizer', () => {
  const mockOnResize = jest.fn()
  const mockToggleLeftPanel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLayoutStore.mockReturnValue({
      toggleLeftPanel: mockToggleLeftPanel,
    })
  })

  it('renders the resizer element', () => {
    render(<PanelResizer onResize={mockOnResize} />)

    const resizer = screen.getByRole('separator')
    expect(resizer).toBeInTheDocument()
  })

  it('has correct ARIA attributes when not collapsed', () => {
    render(<PanelResizer onResize={mockOnResize} collapsed={false} />)

    const resizer = screen.getByRole('separator')
    expect(resizer).toHaveAttribute('aria-orientation', 'vertical')
    expect(resizer).toHaveAttribute('aria-label', 'Resize panels horizontally')
    expect(resizer).toHaveAttribute('tabIndex', '0')
  })

  it('has correct ARIA attributes when collapsed', () => {
    render(<PanelResizer onResize={mockOnResize} collapsed={true} />)

    const resizer = screen.getByRole('separator')
    expect(resizer).toHaveAttribute('aria-label', 'Expand left panel')
  })

  it('has resizer class by default', () => {
    const { container } = render(<PanelResizer onResize={mockOnResize} />)

    const resizer = container.querySelector('.resizer')
    expect(resizer).toBeInTheDocument()
    expect(resizer).not.toHaveClass('active')
    expect(resizer).not.toHaveClass('collapsed')
  })

  it('has collapsed class when collapsed', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={true} />
    )

    const resizer = container.querySelector('.resizer')
    expect(resizer).toHaveClass('collapsed')
  })

  it('shows expand icon when collapsed', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={true} />
    )

    const expandIcon = container.querySelector('.expandIcon')
    expect(expandIcon).toBeInTheDocument()
    expect(expandIcon).toHaveTextContent('›')
  })

  it('does not show expand icon when not collapsed', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={false} />
    )

    const expandIcon = container.querySelector('.expandIcon')
    expect(expandIcon).not.toBeInTheDocument()
  })

  it('toggles panel instead of dragging when collapsed', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={true} />
    )

    const resizer = container.querySelector('.resizer')!
    fireEvent.mouseDown(resizer, { clientX: 100 })

    expect(mockToggleLeftPanel).toHaveBeenCalled()
    expect(resizer).not.toHaveClass('active')
  })

  it('starts dragging on mousedown when not collapsed', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={false} />
    )

    const resizer = container.querySelector('.resizer')!
    fireEvent.mouseDown(resizer, { clientX: 100 })

    expect(resizer).toHaveClass('active')
    expect(mockToggleLeftPanel).not.toHaveBeenCalled()
  })

  it('calls onResize during mouse movement while dragging', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={false} />
    )

    const resizer = container.querySelector('.resizer')!

    // Start dragging at X=100
    fireEvent.mouseDown(resizer, { clientX: 100 })

    // Move to X=150 (delta of 50)
    fireEvent.mouseMove(document, { clientX: 150 })

    expect(mockOnResize).toHaveBeenCalledWith(50)
  })

  it('does not call onResize when not dragging', () => {
    render(<PanelResizer onResize={mockOnResize} collapsed={false} />)

    fireEvent.mouseMove(document, { clientX: 150 })

    expect(mockOnResize).not.toHaveBeenCalled()
  })

  it('stops dragging on mouseup', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={false} />
    )

    const resizer = container.querySelector('.resizer')!

    // Start dragging
    fireEvent.mouseDown(resizer, { clientX: 100 })
    expect(resizer).toHaveClass('active')

    // Stop dragging
    fireEvent.mouseUp(document)
    expect(resizer).not.toHaveClass('active')
  })

  it('tracks cumulative drag movement', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={false} />
    )

    const resizer = container.querySelector('.resizer')!

    // Start dragging at X=100
    fireEvent.mouseDown(resizer, { clientX: 100 })

    // Move to X=120 (delta of 20)
    fireEvent.mouseMove(document, { clientX: 120 })
    expect(mockOnResize).toHaveBeenLastCalledWith(20)

    // Move to X=180 (delta of 60 from 120)
    fireEvent.mouseMove(document, { clientX: 180 })
    expect(mockOnResize).toHaveBeenLastCalledWith(60)
  })

  it('sets cursor style during drag', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={false} />
    )

    const resizer = container.querySelector('.resizer')!

    fireEvent.mouseDown(resizer, { clientX: 100 })

    expect(document.body.style.cursor).toBe('col-resize')
    expect(document.body.style.userSelect).toBe('none')

    fireEvent.mouseUp(document)

    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })

  it('cleans up event listeners on unmount', () => {
    const { container, unmount } = render(
      <PanelResizer onResize={mockOnResize} collapsed={false} />
    )

    const resizer = container.querySelector('.resizer')!

    // Start dragging
    fireEvent.mouseDown(resizer, { clientX: 100 })

    // Unmount while dragging
    unmount()

    // Body styles should be cleaned up
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })

  it('prevents default on mousedown when not collapsed', () => {
    const { container } = render(
      <PanelResizer onResize={mockOnResize} collapsed={false} />
    )

    const resizer = container.querySelector('.resizer')!

    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 100,
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = jest.spyOn(mouseDownEvent, 'preventDefault')

    resizer.dispatchEvent(mouseDownEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('defaults collapsed to false', () => {
    const { container } = render(<PanelResizer onResize={mockOnResize} />)

    const resizer = container.querySelector('.resizer')
    expect(resizer).not.toHaveClass('collapsed')
  })
})
