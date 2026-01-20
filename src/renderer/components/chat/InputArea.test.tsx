import { render, screen, fireEvent } from '@testing-library/react'
import { InputArea } from './InputArea'

const defaultProps = {
  value: '',
  onChange: jest.fn(),
  onSend: jest.fn(),
  onCancel: jest.fn(),
  onHistoryNavigate: jest.fn(),
  disabled: false,
  isGenerating: false,
}

describe('InputArea', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the textarea', () => {
    render(<InputArea {...defaultProps} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders the send button when not generating', () => {
    render(<InputArea {...defaultProps} />)
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('renders the cancel button when generating', () => {
    render(<InputArea {...defaultProps} isGenerating={true} />)
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(<InputArea {...defaultProps} value="test message" />)
    expect(screen.getByRole('textbox')).toHaveValue('test message')
  })

  it('calls onChange when typing', () => {
    const onChange = jest.fn()
    render(<InputArea {...defaultProps} onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hello' },
    })

    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('calls onSend when Enter is pressed without Shift', () => {
    const onSend = jest.fn()
    render(<InputArea {...defaultProps} value="test" onSend={onSend} />)

    fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 'Enter',
      shiftKey: false,
    })

    expect(onSend).toHaveBeenCalled()
  })

  it('does not call onSend when Shift+Enter is pressed', () => {
    const onSend = jest.fn()
    render(<InputArea {...defaultProps} value="test" onSend={onSend} />)

    fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 'Enter',
      shiftKey: true,
    })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('calls onSend when send button is clicked', () => {
    const onSend = jest.fn()
    render(<InputArea {...defaultProps} value="test" onSend={onSend} />)

    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(onSend).toHaveBeenCalled()
  })

  it('does not call onSend when value is empty', () => {
    const onSend = jest.fn()
    render(<InputArea {...defaultProps} value="" onSend={onSend} />)

    fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 'Enter',
      shiftKey: false,
    })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn()
    render(
      <InputArea {...defaultProps} isGenerating={true} onCancel={onCancel} />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onHistoryNavigate("up") when ArrowUp is pressed in empty input', () => {
    const onHistoryNavigate = jest.fn()
    render(
      <InputArea
        {...defaultProps}
        value=""
        onHistoryNavigate={onHistoryNavigate}
      />
    )

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowUp' })

    expect(onHistoryNavigate).toHaveBeenCalledWith('up')
  })

  it('calls onHistoryNavigate("down") when ArrowDown is pressed in empty input', () => {
    const onHistoryNavigate = jest.fn()
    render(
      <InputArea
        {...defaultProps}
        value=""
        onHistoryNavigate={onHistoryNavigate}
      />
    )

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowDown' })

    expect(onHistoryNavigate).toHaveBeenCalledWith('down')
  })

  it('calls onChange with empty string when Escape is pressed and not generating', () => {
    const onChange = jest.fn()
    render(
      <InputArea {...defaultProps} value="test" onChange={onChange} />
    )

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' })

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('calls onCancel when Escape is pressed while generating', () => {
    const onCancel = jest.fn()
    render(
      <InputArea
        {...defaultProps}
        value="test"
        isGenerating={true}
        onCancel={onCancel}
      />
    )

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' })

    expect(onCancel).toHaveBeenCalled()
  })

  it('disables the textarea when disabled is true', () => {
    render(<InputArea {...defaultProps} disabled={true} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('disables send button when disabled is true', () => {
    render(<InputArea {...defaultProps} disabled={true} value="test" />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('disables send button when value is empty', () => {
    render(<InputArea {...defaultProps} value="" />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('shows placeholder when not generating', () => {
    render(<InputArea {...defaultProps} />)
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
  })

  it('shows generating placeholder when generating', () => {
    render(<InputArea {...defaultProps} isGenerating={true} />)
    expect(
      screen.getByPlaceholderText('Waiting for response...')
    ).toBeInTheDocument()
  })
})
