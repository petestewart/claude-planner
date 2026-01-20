import { render, screen, fireEvent } from '@testing-library/react'
import { TemplatePreview } from './TemplatePreview'
import type { Template } from '../../../shared/types/template'

const mockTemplate: Template = {
  id: 'standard',
  name: 'Standard',
  description: 'General-purpose template for any project type',
  category: 'other',
  isBuiltIn: true,
  tags: ['general', 'starter'],
  version: '1.0.0',
  createdAt: '2025-01-20',
  updatedAt: '2025-01-20',
  files: [
    {
      outputPath: 'CLAUDE.md',
      template: 'CLAUDE.md.hbs',
      description: 'Agent guidelines and project overview',
      required: true,
    },
    {
      outputPath: 'specs/README.md',
      template: 'specs-README.md.hbs',
      description: 'Specification index',
      required: true,
    },
    {
      outputPath: 'PLAN.md',
      template: 'PLAN.md.hbs',
      description: 'Implementation plan',
      required: false,
    },
  ],
  variables: [
    {
      name: 'projectName',
      label: 'Project Name',
      type: 'string',
      required: true,
    },
    {
      name: 'projectDescription',
      label: 'Project Description',
      type: 'multiline',
      required: true,
      description: 'A brief description of your project',
    },
  ],
  questionFlow: [
    {
      id: 'overview',
      title: 'Project Overview',
      questions: [
        {
          id: 'problem',
          text: 'What problem does this application solve?',
          type: 'multiline',
          variable: 'problemStatement',
          required: true,
        },
        {
          id: 'users',
          text: 'Who are the target users?',
          type: 'multiline',
          variable: 'targetUsers',
          required: false,
        },
      ],
    },
  ],
  defaultGenerationMode: 'incremental',
}

describe('TemplatePreview', () => {
  const defaultProps = {
    template: mockTemplate,
    onUse: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders template name and description', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('General-purpose template for any project type')).toBeInTheDocument()
  })

  it('shows category badge', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('displays version number', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })

  it('shows "Use This Template" button', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText('Use This Template')).toBeInTheDocument()
  })

  it('calls onUse when "Use This Template" is clicked', () => {
    render(<TemplatePreview {...defaultProps} />)

    fireEvent.click(screen.getByText('Use This Template'))
    expect(defaultProps.onUse).toHaveBeenCalled()
  })

  it('displays files section', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText('Files Generated (3)')).toBeInTheDocument()
    expect(screen.getByText('CLAUDE.md')).toBeInTheDocument()
    expect(screen.getByText('specs/README.md')).toBeInTheDocument()
    expect(screen.getByText('PLAN.md')).toBeInTheDocument()
  })

  it('shows required/optional badges for files', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getAllByText('Required').length).toBe(2)
    expect(screen.getByText('Optional')).toBeInTheDocument()
  })

  it('displays variables section', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText('Variables (2)')).toBeInTheDocument()
    expect(screen.getByText('{{projectName}}')).toBeInTheDocument()
    expect(screen.getByText('{{projectDescription}}')).toBeInTheDocument()
  })

  it('shows variable descriptions when provided', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText('A brief description of your project')).toBeInTheDocument()
  })

  it('displays question flow section', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText('Question Flow (1 sections)')).toBeInTheDocument()
    expect(screen.getByText('Project Overview')).toBeInTheDocument()
  })

  it('shows question text', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText(/What problem does this application solve\?/)).toBeInTheDocument()
    expect(screen.getByText(/Who are the target users\?/)).toBeInTheDocument()
  })

  it('displays tags', () => {
    render(<TemplatePreview {...defaultProps} />)

    expect(screen.getByText('general')).toBeInTheDocument()
    expect(screen.getByText('starter')).toBeInTheDocument()
  })

  it('shows Back button when onBack is provided', () => {
    const onBack = jest.fn()
    render(<TemplatePreview {...defaultProps} onBack={onBack} />)

    expect(screen.getByText('Back')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Back'))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows Edit button for custom templates when onEdit is provided', () => {
    const customTemplate: Template = {
      ...mockTemplate,
      isBuiltIn: false,
    }
    const onEdit = jest.fn()

    render(<TemplatePreview template={customTemplate} onUse={jest.fn()} onEdit={onEdit} />)

    expect(screen.getByText('Edit')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Edit'))
    expect(onEdit).toHaveBeenCalled()
  })

  it('does not show Edit button for built-in templates', () => {
    const onEdit = jest.fn()
    render(<TemplatePreview {...defaultProps} onEdit={onEdit} />)

    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('shows author when provided', () => {
    const templateWithAuthor: Template = {
      ...mockTemplate,
      author: 'John Doe',
    }

    render(<TemplatePreview template={templateWithAuthor} onUse={jest.fn()} />)

    expect(screen.getByText('by John Doe')).toBeInTheDocument()
  })

  it('shows conditional badge for conditional sections', () => {
    const templateWithCondition: Template = {
      ...mockTemplate,
      questionFlow: [
        {
          id: 'backend',
          title: 'Backend & Data',
          condition: { variable: 'hasBackend', operator: 'equals', value: true },
          questions: [
            {
              id: 'db',
              text: 'What database?',
              type: 'select',
              variable: 'database',
              required: true,
            },
          ],
        },
      ],
    }

    render(<TemplatePreview template={templateWithCondition} onUse={jest.fn()} />)

    expect(screen.getByText(/\(Conditional\)/)).toBeInTheDocument()
  })
})
