import { render, screen, fireEvent } from '@testing-library/react'
import { InputDialog } from './InputDialog'

describe('InputDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Dialog',
    label: 'Test Label',
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <InputDialog {...defaultProps} isOpen={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the dialog when open', () => {
    render(<InputDialog {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('displays the default value', () => {
    render(<InputDialog {...defaultProps} defaultValue="default.txt" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('default.txt')
  })

  it('displays placeholder text', () => {
    render(<InputDialog {...defaultProps} placeholder="Enter name..." />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Enter name...')
  })

  it('displays custom button labels', () => {
    render(
      <InputDialog {...defaultProps} submitLabel="Save" cancelLabel="Close" />
    )
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('calls onCancel when Cancel button is clicked', () => {
    render(<InputDialog {...defaultProps} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when overlay is clicked', () => {
    render(<InputDialog {...defaultProps} />)
    // The overlay is the element with role="dialog" itself (not its parent)
    const overlay = screen.getByRole('dialog')
    fireEvent.click(overlay)
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not call onCancel when dialog content is clicked', () => {
    render(<InputDialog {...defaultProps} />)
    fireEvent.click(screen.getByText('Test Dialog'))
    expect(defaultProps.onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when Escape is pressed', () => {
    render(<InputDialog {...defaultProps} />)
    // The keyDown handler is on the overlay div with role="dialog"
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onSubmit with value when form is submitted', () => {
    render(<InputDialog {...defaultProps} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test-file.txt' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('test-file.txt')
  })

  it('calls onSubmit with trimmed value', () => {
    render(<InputDialog {...defaultProps} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '  spaced-name.txt  ' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('spaced-name.txt')
  })

  it('calls onSubmit when Enter is pressed with valid value', () => {
    render(<InputDialog {...defaultProps} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'enter-file.txt' } })
    // The keyDown handler is on the overlay div with role="dialog"
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' })
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('enter-file.txt')
  })

  it('disables submit button when input is empty', () => {
    render(<InputDialog {...defaultProps} />)
    const submitButton = screen.getByRole('button', { name: /create/i })
    expect(submitButton).toBeDisabled()
  })

  it('disables submit button when input is only whitespace', () => {
    render(<InputDialog {...defaultProps} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '   ' } })
    const submitButton = screen.getByRole('button', { name: /create/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when input has value', () => {
    render(<InputDialog {...defaultProps} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'valid-name.txt' } })
    const submitButton = screen.getByRole('button', { name: /create/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('does not call onSubmit when Enter is pressed with empty input', () => {
    render(<InputDialog {...defaultProps} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' })
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('resets value when dialog reopens with new defaultValue', () => {
    const { rerender } = render(
      <InputDialog
        {...defaultProps}
        isOpen={false}
        defaultValue="old-value.txt"
      />
    )

    // Open the dialog with new defaultValue
    rerender(
      <InputDialog
        {...defaultProps}
        isOpen={true}
        defaultValue="new-value.txt"
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('new-value.txt')
  })
})
