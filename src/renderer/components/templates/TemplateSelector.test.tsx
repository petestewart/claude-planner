import { render, screen, fireEvent } from '@testing-library/react'
import { TemplateSelector } from './TemplateSelector'
import type { TemplateInfo } from '../../../shared/types/template'

const mockTemplates: TemplateInfo[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'General-purpose template for any project type',
    category: 'other',
    isBuiltIn: true,
    tags: ['general', 'starter'],
  },
  {
    id: 'web-app',
    name: 'Web Application',
    description: 'Template for modern web applications',
    category: 'web-app',
    isBuiltIn: true,
    tags: ['web', 'frontend', 'react'],
  },
  {
    id: 'custom-1',
    name: 'My Custom Template',
    description: 'A custom template I created',
    category: 'library',
    isBuiltIn: false,
    tags: ['custom'],
  },
]

describe('TemplateSelector', () => {
  const defaultProps = {
    templates: mockTemplates,
    selectedId: null,
    onSelect: jest.fn(),
    onManageTemplates: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with title and filters', () => {
    render(<TemplateSelector {...defaultProps} />)

    expect(screen.getByText('Choose a Template')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument()
    expect(screen.getByText('Manage Templates')).toBeInTheDocument()
  })

  it('displays built-in and custom template sections', () => {
    render(<TemplateSelector {...defaultProps} />)

    expect(screen.getByText('Built-in Templates')).toBeInTheDocument()
    expect(screen.getByText('Custom Templates')).toBeInTheDocument()
  })

  it('displays template cards with correct information', () => {
    render(<TemplateSelector {...defaultProps} />)

    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('Web Application')).toBeInTheDocument()
    expect(screen.getByText('My Custom Template')).toBeInTheDocument()
  })

  it('calls onSelect when a template card is clicked', () => {
    render(<TemplateSelector {...defaultProps} />)

    fireEvent.click(screen.getByText('Standard'))
    expect(defaultProps.onSelect).toHaveBeenCalledWith('standard')
  })

  it('shows selected state for selected template', () => {
    render(<TemplateSelector {...defaultProps} selectedId="standard" />)

    const standardCard = screen.getByText('Standard').closest('button')
    expect(standardCard).toHaveClass('templateCard--selected')
  })

  it('filters templates by search query', () => {
    render(<TemplateSelector {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search templates...')
    fireEvent.change(searchInput, { target: { value: 'web' } })

    expect(screen.getByText('Web Application')).toBeInTheDocument()
    expect(screen.queryByText('Standard')).not.toBeInTheDocument()
    expect(screen.queryByText('My Custom Template')).not.toBeInTheDocument()
  })

  it('filters templates by category', () => {
    render(<TemplateSelector {...defaultProps} />)

    const categoryFilter = screen.getByRole('combobox')
    fireEvent.change(categoryFilter, { target: { value: 'web-app' } })

    expect(screen.getByText('Web Application')).toBeInTheDocument()
    expect(screen.queryByText('Standard')).not.toBeInTheDocument()
    expect(screen.queryByText('My Custom Template')).not.toBeInTheDocument()
  })

  it('shows empty state when no templates match filters', () => {
    render(<TemplateSelector {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search templates...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    expect(screen.getByText('No templates match your filters')).toBeInTheDocument()
    expect(screen.getByText('Clear Filters')).toBeInTheDocument()
  })

  it('clears filters when Clear Filters button is clicked', () => {
    render(<TemplateSelector {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search templates...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    fireEvent.click(screen.getByText('Clear Filters'))

    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('Web Application')).toBeInTheDocument()
  })

  it('calls onManageTemplates when Manage Templates button is clicked', () => {
    render(<TemplateSelector {...defaultProps} />)

    fireEvent.click(screen.getByText('Manage Templates'))
    expect(defaultProps.onManageTemplates).toHaveBeenCalled()
  })

  it('shows loading state when isLoading is true', () => {
    render(<TemplateSelector {...defaultProps} isLoading={true} />)

    expect(screen.getByText('Loading templates...')).toBeInTheDocument()
    expect(screen.queryByText('Choose a Template')).not.toBeInTheDocument()
  })

  it('displays category badges on cards', () => {
    render(<TemplateSelector {...defaultProps} />)

    expect(screen.getAllByText('Other').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Web App').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Library').length).toBeGreaterThan(0)
  })

  it('displays built-in badge on built-in templates', () => {
    render(<TemplateSelector {...defaultProps} />)

    const builtInBadges = screen.getAllByText('Built-in')
    expect(builtInBadges.length).toBe(2) // Standard and Web Application
  })

  it('displays tags on template cards', () => {
    render(<TemplateSelector {...defaultProps} />)

    expect(screen.getByText('general')).toBeInTheDocument()
    expect(screen.getByText('starter')).toBeInTheDocument()
  })

  it('shows +N for extra tags when more than 2', () => {
    const templatesWithManyTags: TemplateInfo[] = [
      {
        id: 'many-tags',
        name: 'Many Tags',
        description: 'Template with many tags',
        category: 'other',
        isBuiltIn: true,
        tags: ['tag1', 'tag2', 'tag3', 'tag4'],
      },
    ]

    render(
      <TemplateSelector
        {...defaultProps}
        templates={templatesWithManyTags}
      />
    )

    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })
})
