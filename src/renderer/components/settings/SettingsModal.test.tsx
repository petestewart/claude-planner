import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsModal } from './SettingsModal'
import { useSettingsStore } from '../../stores/settingsStore'
import { useEditorStore } from '../../stores/editorStore'
import { useProjectStore } from '../../stores/projectStore'

// Mock stores
jest.mock('../../stores/settingsStore')
jest.mock('../../stores/editorStore')
jest.mock('../../stores/projectStore')

// Mock CSS modules
jest.mock('./settings-modal.module.css', () => ({
  overlay: 'overlay',
  modal: 'modal',
  header: 'header',
  title: 'title',
  closeButton: 'closeButton',
  content: 'content',
  section: 'section',
  sectionHeader: 'sectionHeader',
  sectionIcon: 'sectionIcon',
  sectionTitle: 'sectionTitle',
  settingRow: 'settingRow',
  settingInfo: 'settingInfo',
  settingLabel: 'settingLabel',
  settingDescription: 'settingDescription',
  settingControl: 'settingControl',
  toggle: 'toggle',
  active: 'active',
  toggleHandle: 'toggleHandle',
  numberInput: 'numberInput',
  select: 'select',
  textInput: 'textInput',
  footer: 'footer',
  buttonSecondary: 'buttonSecondary',
}))

const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<
  typeof useSettingsStore
>
const mockUseEditorStore = useEditorStore as jest.MockedFunction<
  typeof useEditorStore
>
const mockUseProjectStore = useProjectStore as jest.MockedFunction<
  typeof useProjectStore
>

describe('SettingsModal', () => {
  const defaultSettingsState = {
    autoSaveDelay: 2000,
    commitMessageTemplate: 'Auto: {action} {file}',
    claudeCliPath: 'claude',
    claudeTimeout: 120,
    customTemplatesPath: '~/.spec-planner/templates',
    setAutoSaveDelay: jest.fn(),
    setCommitMessageTemplate: jest.fn(),
    setClaudeCliPath: jest.fn(),
    setClaudeTimeout: jest.fn(),
    setCustomTemplatesPath: jest.fn(),
  }

  const defaultEditorState = {
    autoSaveEnabled: true,
    mode: 'markdown' as const,
    setAutoSaveEnabled: jest.fn(),
    setMode: jest.fn(),
  }

  const defaultProjectState = {
    project: {
      gitConfig: {
        autoCommit: false,
      },
    },
    setGitConfig: jest.fn(),
  }

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSettingsStore.mockReturnValue(defaultSettingsState)
    mockUseEditorStore.mockImplementation((selector) => {
      if (!selector) return defaultEditorState
      return selector(defaultEditorState as never)
    })
    mockUseProjectStore.mockImplementation((selector) => {
      if (!selector) return defaultProjectState
      return selector(defaultProjectState as never)
    })
  })

  it('returns null when not open', () => {
    const { container } = render(
      <SettingsModal {...defaultProps} isOpen={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal when open', () => {
    render(<SettingsModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders settings title', () => {
    render(<SettingsModal {...defaultProps} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders all section headers', () => {
    render(<SettingsModal {...defaultProps} />)

    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('Git')).toBeInTheDocument()
    expect(screen.getByText('Claude')).toBeInTheDocument()
    expect(screen.getByText('Templates')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<SettingsModal {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /close settings/i }))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when overlay is clicked', () => {
    const { container } = render(<SettingsModal {...defaultProps} />)

    const overlay = container.querySelector('.overlay')
    fireEvent.click(overlay!)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('does not call onClose when modal content is clicked', () => {
    const { container } = render(<SettingsModal {...defaultProps} />)

    const modal = container.querySelector('.modal')
    fireEvent.click(modal!)

    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', () => {
    render(<SettingsModal {...defaultProps} />)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when footer Close button is clicked', () => {
    render(<SettingsModal {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  describe('Editor Settings', () => {
    it('renders auto-save toggle', () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByText('Auto-save')).toBeInTheDocument()
    })

    it('toggles auto-save when switch is clicked', () => {
      render(<SettingsModal {...defaultProps} />)

      // Get the first toggle (auto-save toggle)
      const toggles = screen.getAllByRole('switch')
      expect(toggles.length).toBeGreaterThan(0)
      const toggle = toggles[0]!
      fireEvent.click(toggle)

      expect(defaultEditorState.setAutoSaveEnabled).toHaveBeenCalledWith(false)
    })

    it('renders auto-save delay input with correct value', () => {
      render(<SettingsModal {...defaultProps} />)

      const input = screen.getByDisplayValue('2000')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('updates auto-save delay when changed', () => {
      render(<SettingsModal {...defaultProps} />)

      const input = screen.getByDisplayValue('2000')
      fireEvent.change(input, { target: { value: '3000' } })

      expect(defaultSettingsState.setAutoSaveDelay).toHaveBeenCalledWith(3000)
    })

    it('renders editor mode select with correct value', () => {
      render(<SettingsModal {...defaultProps} />)

      const select = screen.getByDisplayValue('Markdown')
      expect(select).toBeInTheDocument()
    })

    it('updates editor mode when changed', () => {
      render(<SettingsModal {...defaultProps} />)

      const select = screen.getByDisplayValue('Markdown')
      fireEvent.change(select, { target: { value: 'wysiwyg' } })

      expect(defaultEditorState.setMode).toHaveBeenCalledWith('wysiwyg')
    })
  })

  describe('Git Settings', () => {
    it('renders auto-commit toggle', () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByText('Auto-commit')).toBeInTheDocument()
    })

    it('toggles auto-commit when switch is clicked', () => {
      render(<SettingsModal {...defaultProps} />)

      // Find the auto-commit toggle (second toggle in the modal)
      const toggles = screen.getAllByRole('switch')
      expect(toggles.length).toBeGreaterThan(1)
      const autoCommitToggle = toggles[1]!
      fireEvent.click(autoCommitToggle)

      expect(defaultProjectState.setGitConfig).toHaveBeenCalledWith({
        autoCommit: true,
      })
    })

    it('renders commit message template input', () => {
      render(<SettingsModal {...defaultProps} />)

      expect(
        screen.getByDisplayValue('Auto: {action} {file}')
      ).toBeInTheDocument()
    })

    it('updates commit message template when changed', () => {
      render(<SettingsModal {...defaultProps} />)

      const input = screen.getByDisplayValue('Auto: {action} {file}')
      fireEvent.change(input, { target: { value: 'New template' } })

      expect(defaultSettingsState.setCommitMessageTemplate).toHaveBeenCalledWith(
        'New template'
      )
    })
  })

  describe('Claude Settings', () => {
    it('renders CLI path input', () => {
      render(<SettingsModal {...defaultProps} />)

      expect(screen.getByDisplayValue('claude')).toBeInTheDocument()
    })

    it('updates CLI path when changed', () => {
      render(<SettingsModal {...defaultProps} />)

      const input = screen.getByDisplayValue('claude')
      fireEvent.change(input, { target: { value: '/usr/bin/claude' } })

      expect(defaultSettingsState.setClaudeCliPath).toHaveBeenCalledWith(
        '/usr/bin/claude'
      )
    })

    it('renders timeout input with correct value', () => {
      render(<SettingsModal {...defaultProps} />)

      expect(screen.getByDisplayValue('120')).toBeInTheDocument()
    })

    it('updates timeout when changed', () => {
      render(<SettingsModal {...defaultProps} />)

      const input = screen.getByDisplayValue('120')
      fireEvent.change(input, { target: { value: '180' } })

      expect(defaultSettingsState.setClaudeTimeout).toHaveBeenCalledWith(180)
    })
  })

  describe('Template Settings', () => {
    it('renders custom templates path input', () => {
      render(<SettingsModal {...defaultProps} />)

      expect(
        screen.getByDisplayValue('~/.spec-planner/templates')
      ).toBeInTheDocument()
    })

    it('updates custom templates path when changed', () => {
      render(<SettingsModal {...defaultProps} />)

      const input = screen.getByDisplayValue('~/.spec-planner/templates')
      fireEvent.change(input, { target: { value: '/custom/path' } })

      expect(defaultSettingsState.setCustomTemplatesPath).toHaveBeenCalledWith(
        '/custom/path'
      )
    })
  })

  describe('Accessibility', () => {
    it('has correct aria attributes on modal', () => {
      render(<SettingsModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'settings-title')
    })

    it('auto-save toggle has correct aria-checked', () => {
      render(<SettingsModal {...defaultProps} />)

      const toggles = screen.getAllByRole('switch')
      expect(toggles[0]).toHaveAttribute('aria-checked', 'true')
    })
  })
})
