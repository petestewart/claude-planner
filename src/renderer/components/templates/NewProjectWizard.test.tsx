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
  })

  it('renders nothing when closed', () => {
    render(<NewProjectWizard {...defaultProps} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders wizard modal when open', () => {
    render(<NewProjectWizard {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('New Project - Select Location')).toBeInTheDocument()
  })

  it('shows folder selection step initially', () => {
    render(<NewProjectWizard {...defaultProps} />)

    expect(screen.getByText('Where should we create your project?')).toBeInTheDocument()
    expect(screen.getByText('Select Folder')).toBeInTheDocument()
  })

  it('shows step indicator with 3 steps', () => {
    render(<NewProjectWizard {...defaultProps} />)

    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Template')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('advances to template selection after folder is selected', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Select Folder'))

    await waitFor(() => {
      expect(screen.getByText('New Project - Choose Template')).toBeInTheDocument()
    })
  })

  it('shows selected folder path after selection', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Select Folder'))

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

    fireEvent.click(screen.getByText('Select Folder'))

    await waitFor(() => {
      expect(screen.getByText('New Project - Choose Template')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Change'))

    expect(screen.getByText('New Project - Select Location')).toBeInTheDocument()
  })

  it('advances to preview after template is selected', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    // Select folder
    fireEvent.click(screen.getByText('Select Folder'))

    await waitFor(() => {
      expect(screen.getByText('New Project - Choose Template')).toBeInTheDocument()
    })

    // Select template
    fireEvent.click(screen.getByText('Standard'))

    await waitFor(() => {
      expect(screen.getByText('New Project - Review & Create')).toBeInTheDocument()
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
    fireEvent.click(screen.getByText('Select Folder'))

    await waitFor(() => {
      expect(screen.getByText('New Project - Choose Template')).toBeInTheDocument()
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
    fireEvent.click(screen.getByText('Select Folder'))

    await waitFor(() => {
      expect(screen.getByText('New Project - Choose Template')).toBeInTheDocument()
    })

    // Close wizard
    rerender(<NewProjectWizard {...defaultProps} isOpen={false} />)

    // Reopen wizard
    rerender(<NewProjectWizard {...defaultProps} isOpen={true} />)

    // Should be back at step 1
    expect(screen.getByText('New Project - Select Location')).toBeInTheDocument()
  })

  it('handles folder selection cancellation', async () => {
    mockApi.dir.select.mockResolvedValue(null)

    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Select Folder'))

    // Should still be on step 1
    await waitFor(() => {
      expect(screen.getByText('New Project - Select Location')).toBeInTheDocument()
    })
  })

  it('shows back button in template selection step', async () => {
    render(<NewProjectWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Select Folder'))

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument()
    })
  })
})
