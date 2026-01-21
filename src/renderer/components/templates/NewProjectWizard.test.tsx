import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewProjectWizard } from './NewProjectWizard'
import type { TemplateInfo, Template } from '../../../shared/types/template'

// Mock the window.api
const mockTemplateList: TemplateInfo[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'General-purpose template',
    category: 'other',
    isBuiltIn: true,
    tags: ['general'],
  },
]

const mockTemplate: Template = {
  id: 'standard',
  name: 'Standard',
  description: 'General-purpose template',
  category: 'other',
  isBuiltIn: true,
  tags: ['general'],
  version: '1.0.0',
  createdAt: '2025-01-20',
  updatedAt: '2025-01-20',
  files: [
    {
      outputPath: 'CLAUDE.md',
      template: 'CLAUDE.md.hbs',
      description: 'Agent guidelines',
      required: true,
    },
  ],
  variables: [],
  questionFlow: [],
  defaultGenerationMode: 'incremental',
}

const mockApi = {
  dir: {
    select: jest.fn(),
    create: jest.fn(),
  },
  template: {
    list: jest.fn(),
    get: jest.fn(),
  },
}

beforeAll(() => {
  Object.defineProperty(window, 'api', {
    value: mockApi,
    writable: true,
  })
})

describe('NewProjectWizard', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onProjectCreate: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockApi.template.list.mockResolvedValue(mockTemplateList)
    mockApi.template.get.mockResolvedValue(mockTemplate)
    mockApi.dir.select.mockResolvedValue('/path/to/project')
    mockApi.dir.create.mockResolvedValue(undefined)
  })

  it('renders nothing when closed', () => {
    render(<NewProjectWizard {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders wizard modal when open', () => {
    render(<NewProjectWizard {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByText('New Project - Select Location')
    ).toBeInTheDocument()
  })

  it('shows folder selection step initially with both options', () => {
    render(<NewProjectWizard {...defaultProps} />)

    expect(
      screen.getByText('Where should we create your project?')
    ).toBeInTheDocument()
    expect(screen.getByText('Select Existing Folder')).toBeInTheDocument()
    expect(screen.getByText('Create New Folder')).toBeInTheDocument()
  })

  it('shows step indicator with 3 steps', () => {
    render(<NewProjectWizard {...defaultProps} />)

    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Template')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('advances to template selection after folder is selected', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Select Existing Folder'))

    await waitFor(() => {
      expect(
        screen.getByText('New Project - Choose Template')
      ).toBeInTheDocument()
    })
  })

  it('shows selected folder path after selection', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Select Existing Folder'))

    await waitFor(() => {
      expect(screen.getByText('/path/to/project')).toBeInTheDocument()
    })
  })

  it('loads templates when wizard opens', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    expect(mockApi.template.list).toHaveBeenCalled()
  })

  it('allows going back from template selection', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Select Existing Folder'))

    await waitFor(() => {
      expect(
        screen.getByText('New Project - Choose Template')
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Change'))

    expect(
      screen.getByText('New Project - Select Location')
    ).toBeInTheDocument()
  })

  it('advances to preview after template is selected', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    // Select folder
    fireEvent.click(screen.getByText('Select Existing Folder'))

    await waitFor(() => {
      expect(
        screen.getByText('New Project - Choose Template')
      ).toBeInTheDocument()
    })

    // Select template
    fireEvent.click(screen.getByText('Standard'))

    await waitFor(() => {
      expect(
        screen.getByText('New Project - Review & Create')
      ).toBeInTheDocument()
    })
  })

  it('calls onClose when close button is clicked', () => {
    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByLabelText('Close wizard'))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when overlay is clicked', () => {
    render(<NewProjectWizard {...defaultProps} />)

    // The overlay is the parent div with role="dialog"
    const overlay = screen.getByRole('dialog').parentElement
    if (overlay) {
      fireEvent.click(overlay)
    }

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onProjectCreate when Use This Template is clicked', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    // Select folder
    fireEvent.click(screen.getByText('Select Existing Folder'))

    await waitFor(() => {
      expect(
        screen.getByText('New Project - Choose Template')
      ).toBeInTheDocument()
    })

    // Select template
    fireEvent.click(screen.getByText('Standard'))

    await waitFor(() => {
      expect(screen.getByText('Use This Template')).toBeInTheDocument()
    })

    // Create project
    fireEvent.click(screen.getByText('Use This Template'))

    expect(defaultProps.onProjectCreate).toHaveBeenCalledWith({
      folderPath: '/path/to/project',
      templateId: 'standard',
      template: mockTemplate,
    })
  })

  it('resets state when wizard closes and reopens', async () => {
    const { rerender } = render(<NewProjectWizard {...defaultProps} />)

    // Select folder
    fireEvent.click(screen.getByText('Select Existing Folder'))

    await waitFor(() => {
      expect(
        screen.getByText('New Project - Choose Template')
      ).toBeInTheDocument()
    })

    // Close wizard
    rerender(<NewProjectWizard {...defaultProps} isOpen={false} />)

    // Reopen wizard
    rerender(<NewProjectWizard {...defaultProps} isOpen={true} />)

    // Should be back at step 1
    expect(
      screen.getByText('New Project - Select Location')
    ).toBeInTheDocument()
  })

  it('handles folder selection cancellation', async () => {
    mockApi.dir.select.mockResolvedValue(null)

    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Select Existing Folder'))

    // Should still be on step 1
    await waitFor(() => {
      expect(
        screen.getByText('New Project - Select Location')
      ).toBeInTheDocument()
    })
  })

  it('shows back button in template selection step', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Select Existing Folder'))

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument()
    })
  })

  describe('Create New Folder', () => {
    it('shows create folder form when Create New Folder is clicked', () => {
      render(<NewProjectWizard {...defaultProps} />)

      fireEvent.click(screen.getByText('Create New Folder'))

      expect(
        screen.getByText('Create a new project folder')
      ).toBeInTheDocument()
      expect(screen.getByText('Parent Directory')).toBeInTheDocument()
      expect(screen.getByLabelText('Folder Name')).toBeInTheDocument()
      expect(screen.getByText('Browse...')).toBeInTheDocument()
    })

    it('shows Cancel button in create folder form', () => {
      render(<NewProjectWizard {...defaultProps} />)

      fireEvent.click(screen.getByText('Create New Folder'))

      // There are two Cancel buttons - one in the form and one in the footer
      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' })
      expect(cancelButtons).toHaveLength(2)
    })

    it('returns to select mode when form Cancel is clicked', () => {
      render(<NewProjectWizard {...defaultProps} />)

      fireEvent.click(screen.getByText('Create New Folder'))

      // Click the first Cancel button (form Cancel, not footer Cancel)
      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' })
      const formCancelButton = cancelButtons[0]
      if (formCancelButton) {
        fireEvent.click(formCancelButton)
      }

      expect(screen.getByText('Select Existing Folder')).toBeInTheDocument()
      expect(screen.getByText('Create New Folder')).toBeInTheDocument()
    })

    it('allows selecting parent folder', async () => {
      mockApi.dir.select.mockResolvedValue('/home/user/projects')

      render(<NewProjectWizard {...defaultProps} />)

      fireEvent.click(screen.getByText('Create New Folder'))
      fireEvent.click(screen.getByText('Browse...'))

      await waitFor(() => {
        expect(screen.getByText('/home/user/projects')).toBeInTheDocument()
      })
    })

    it('shows folder preview when parent and name are entered', async () => {
      mockApi.dir.select.mockResolvedValue('/home/user/projects')

      render(<NewProjectWizard {...defaultProps} />)

      fireEvent.click(screen.getByText('Create New Folder'))
      fireEvent.click(screen.getByText('Browse...'))

      await waitFor(() => {
        expect(screen.getByText('/home/user/projects')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Folder Name'), {
        target: { value: 'my-new-project' },
      })

      expect(screen.getByText('Will create:')).toBeInTheDocument()
      expect(
        screen.getByText('/home/user/projects/my-new-project')
      ).toBeInTheDocument()
    })

    it('creates folder and advances to template selection', async () => {
      mockApi.dir.select.mockResolvedValue('/home/user/projects')

      render(<NewProjectWizard {...defaultProps} />)

      fireEvent.click(screen.getByText('Create New Folder'))
      fireEvent.click(screen.getByText('Browse...'))

      await waitFor(() => {
        expect(screen.getByText('/home/user/projects')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Folder Name'), {
        target: { value: 'my-new-project' },
      })

      fireEvent.click(screen.getByRole('button', { name: 'Create Folder' }))

      await waitFor(() => {
        expect(mockApi.dir.create).toHaveBeenCalledWith(
          '/home/user/projects/my-new-project'
        )
      })

      await waitFor(() => {
        expect(
          screen.getByText('New Project - Choose Template')
        ).toBeInTheDocument()
      })
    })

    it('shows error for invalid folder names', async () => {
      mockApi.dir.select.mockResolvedValue('/home/user/projects')

      render(<NewProjectWizard {...defaultProps} />)

      fireEvent.click(screen.getByText('Create New Folder'))
      fireEvent.click(screen.getByText('Browse...'))

      await waitFor(() => {
        expect(screen.getByText('/home/user/projects')).toBeInTheDocument()
      })

      // Enter invalid folder name with path separator
      fireEvent.change(screen.getByLabelText('Folder Name'), {
        target: { value: 'invalid/name' },
      })

      fireEvent.click(screen.getByRole('button', { name: 'Create Folder' }))

      await waitFor(() => {
        expect(screen.getByText(/invalid characters/i)).toBeInTheDocument()
      })
    })

    it('disables Create Folder button when inputs are empty', () => {
      render(<NewProjectWizard {...defaultProps} />)

      fireEvent.click(screen.getByText('Create New Folder'))

      const createButton = screen.getByRole('button', { name: 'Create Folder' })
      expect(createButton).toBeDisabled()
    })

    it('shows error when folder creation fails', async () => {
      mockApi.dir.select.mockResolvedValue('/home/user/projects')
      mockApi.dir.create.mockRejectedValue(new Error('Folder already exists'))

      render(<NewProjectWizard {...defaultProps} />)

      fireEvent.click(screen.getByText('Create New Folder'))
      fireEvent.click(screen.getByText('Browse...'))

      await waitFor(() => {
        expect(screen.getByText('/home/user/projects')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Folder Name'), {
        target: { value: 'my-project' },
      })

      fireEvent.click(screen.getByRole('button', { name: 'Create Folder' }))

      await waitFor(() => {
        expect(screen.getByText(/Folder already exists/i)).toBeInTheDocument()
      })
    })

    it('resets create folder state when wizard reopens', async () => {
      mockApi.dir.select.mockResolvedValue('/home/user/projects')

      const { rerender } = render(<NewProjectWizard {...defaultProps} />)

      // Enter create folder mode
      fireEvent.click(screen.getByText('Create New Folder'))
      fireEvent.click(screen.getByText('Browse...'))

      await waitFor(() => {
        expect(screen.getByText('/home/user/projects')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Folder Name'), {
        target: { value: 'my-project' },
      })

      // Close and reopen wizard
      rerender(<NewProjectWizard {...defaultProps} isOpen={false} />)
      rerender(<NewProjectWizard {...defaultProps} isOpen={true} />)

      // Should be back at select mode
      expect(screen.getByText('Select Existing Folder')).toBeInTheDocument()
      expect(screen.getByText('Create New Folder')).toBeInTheDocument()
    })
  })
})
