import { render, screen, fireEvent } from '@testing-library/react'
import { HorizontalDivider } from './HorizontalDivider'

// Mock CSS modules
jest.mock('./HorizontalDivider.module.css', () => ({
  divider: 'divider',
  active: 'active',
}))

describe('HorizontalDivider', () => {
  const mockOnDrag = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the divider element', () => {
    render(<HorizontalDivider onDrag={mockOnDrag} />)

    const divider = screen.getByRole('separator')
    expect(divider).toBeInTheDocument()
  })

  it('has correct ARIA attributes', () => {
    render(<HorizontalDivider onDrag={mockOnDrag} />)

    const divider = screen.getByRole('separator')
    expect(divider).toHaveAttribute('aria-orientation', 'horizontal')
    expect(divider).toHaveAttribute('aria-label', 'Resize panels vertically')
    expect(divider).toHaveAttribute('tabIndex', '0')
  })

  it('has divider class by default', () => {
    const { container } = render(<HorizontalDivider onDrag={mockOnDrag} />)

    const divider = container.querySelector('.divider')
    expect(divider).toBeInTheDocument()
    expect(divider).not.toHaveClass('active')
  })

  it('starts dragging on mousedown', () => {
    const { container } = render(<HorizontalDivider onDrag={mockOnDrag} />)

    const divider = container.querySelector('.divider')!
    fireEvent.mouseDown(divider, { clientY: 100 })

    expect(divider).toHaveClass('active')
  })

  it('calls onDrag during mouse movement while dragging', () => {
    const { container } = render(<HorizontalDivider onDrag={mockOnDrag} />)

    const divider = container.querySelector('.divider')!

    // Start dragging at Y=100
    fireEvent.mouseDown(divider, { clientY: 100 })

    // Move to Y=120 (delta of 20)
    fireEvent.mouseMove(document, { clientY: 120 })

    expect(mockOnDrag).toHaveBeenCalledWith(20)
  })

  it('does not call onDrag when not dragging', () => {
    render(<HorizontalDivider onDrag={mockOnDrag} />)

    fireEvent.mouseMove(document, { clientY: 120 })

    expect(mockOnDrag).not.toHaveBeenCalled()
  })

  it('stops dragging on mouseup', () => {
    const { container } = render(<HorizontalDivider onDrag={mockOnDrag} />)

    const divider = container.querySelector('.divider')!

    // Start dragging
    fireEvent.mouseDown(divider, { clientY: 100 })
    expect(divider).toHaveClass('active')

    // Stop dragging
    fireEvent.mouseUp(document)
    expect(divider).not.toHaveClass('active')
  })

  it('tracks cumulative drag movement', () => {
    const { container } = render(<HorizontalDivider onDrag={mockOnDrag} />)

    const divider = container.querySelector('.divider')!

    // Start dragging at Y=100
    fireEvent.mouseDown(divider, { clientY: 100 })

    // Move to Y=120 (delta of 20)
    fireEvent.mouseMove(document, { clientY: 120 })
    expect(mockOnDrag).toHaveBeenLastCalledWith(20)

    // Move to Y=150 (delta of 30 from 120)
    fireEvent.mouseMove(document, { clientY: 150 })
    expect(mockOnDrag).toHaveBeenLastCalledWith(30)
  })

  it('sets cursor style during drag', () => {
    const { container } = render(<HorizontalDivider onDrag={mockOnDrag} />)

    const divider = container.querySelector('.divider')!

    fireEvent.mouseDown(divider, { clientY: 100 })

    expect(document.body.style.cursor).toBe('row-resize')
    expect(document.body.style.userSelect).toBe('none')

    fireEvent.mouseUp(document)

    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })

  it('cleans up event listeners on unmount', () => {
    const { container, unmount } = render(
      <HorizontalDivider onDrag={mockOnDrag} />
    )

    const divider = container.querySelector('.divider')!

    // Start dragging
    fireEvent.mouseDown(divider, { clientY: 100 })

    // Unmount while dragging
    unmount()

    // Body styles should be cleaned up
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })

  it('prevents default on mousedown', () => {
    const { container } = render(<HorizontalDivider onDrag={mockOnDrag} />)

    const divider = container.querySelector('.divider')!

    const mouseDownEvent = new MouseEvent('mousedown', {
      clientY: 100,
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = jest.spyOn(mouseDownEvent, 'preventDefault')

    divider.dispatchEvent(mouseDownEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
