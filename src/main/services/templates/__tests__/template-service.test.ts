/**
 * TemplateService unit tests
 *
 * Tests the main template service with mocked loader and renderer
 */

import type { Template, TemplateInfo } from '../../../../shared/types/template'

// Create mock instances
const mockListTemplates = jest.fn()
const mockGetTemplate = jest.fn()
const mockSaveTemplate = jest.fn()
const mockDeleteTemplate = jest.fn()
const mockGetCustomTemplatesPath = jest.fn().mockReturnValue('/custom/templates')
const mockGetDefaultCustomPath = jest.fn().mockReturnValue('/default/custom/path')
const mockSetCustomPath = jest.fn()

const mockRender = jest.fn()
const mockRenderTemplate = jest.fn()
const mockValidateVariables = jest.fn()

// Mock the TemplateLoader
jest.mock('../template-loader', () => {
  return {
    TemplateLoader: jest.fn().mockImplementation(() => ({
      listTemplates: mockListTemplates,
      getTemplate: mockGetTemplate,
      saveTemplate: mockSaveTemplate,
      deleteTemplate: mockDeleteTemplate,
      getCustomTemplatesPath: mockGetCustomTemplatesPath,
      getDefaultCustomPath: mockGetDefaultCustomPath,
      setCustomPath: mockSetCustomPath,
    })),
  }
})

// Mock the TemplateRenderer
jest.mock('../template-renderer', () => {
  return {
    TemplateRenderer: jest.fn().mockImplementation(() => ({
      render: mockRender,
      renderTemplate: mockRenderTemplate,
      validateVariables: mockValidateVariables,
    })),
  }
})

import { TemplateService, TemplateServiceError, createTemplateService } from '../template-service'

describe('TemplateService', () => {
  let service: TemplateService

  const createMockTemplate = (overrides?: Partial<Template>): Template => ({
    id: 'test-template',
    name: 'Test Template',
    description: 'A test template',
    category: 'other',
    isBuiltIn: false,
    tags: ['test'],
    version: '1.0.0',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    files: [
      {
        outputPath: 'README.md',
        template: '# {{projectName}}',
        description: 'Project README',
        required: true,
      },
    ],
    variables: [
      { name: 'projectName', label: 'Project Name', type: 'string', required: true },
    ],
    questionFlow: [],
    defaultGenerationMode: 'incremental',
    ...overrides,
  })

  const createMockTemplateInfo = (overrides?: Partial<TemplateInfo>): TemplateInfo => ({
    id: 'test-template',
    name: 'Test Template',
    description: 'A test template',
    category: 'other',
    isBuiltIn: false,
    tags: ['test'],
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TemplateService('/custom/templates')
  })

  describe('getCustomTemplatesPath', () => {
    it('returns path from loader', () => {
      const result = service.getCustomTemplatesPath()
      expect(result).toBe('/custom/templates')
      expect(mockGetCustomTemplatesPath).toHaveBeenCalled()
    })
  })

  describe('getDefaultCustomTemplatesPath', () => {
    it('returns default path from loader', () => {
      const result = service.getDefaultCustomTemplatesPath()
      expect(result).toBe('/default/custom/path')
      expect(mockGetDefaultCustomPath).toHaveBeenCalled()
    })
  })

  describe('setCustomTemplatesPath', () => {
    it('sets custom path on loader', () => {
      service.setCustomTemplatesPath('/new/path')
      expect(mockSetCustomPath).toHaveBeenCalledWith('/new/path')
    })

    it('sets null path on loader', () => {
      service.setCustomTemplatesPath(null)
      expect(mockSetCustomPath).toHaveBeenCalledWith(null)
    })
  })

  describe('listTemplates', () => {
    it('returns templates from loader', async () => {
      const templates = [
        createMockTemplateInfo({ id: 'template-1' }),
        createMockTemplateInfo({ id: 'template-2' }),
      ]
      mockListTemplates.mockResolvedValue(templates)

      const result = await service.listTemplates()

      expect(result).toEqual(templates)
      expect(mockListTemplates).toHaveBeenCalled()
    })
  })

  describe('getTemplate', () => {
    it('returns template from loader', async () => {
      const template = createMockTemplate()
      mockGetTemplate.mockResolvedValue(template)

      const result = await service.getTemplate('test-template')

      expect(result).toEqual(template)
      expect(mockGetTemplate).toHaveBeenCalledWith('test-template')
    })

    it('returns null when template not found', async () => {
      mockGetTemplate.mockResolvedValue(null)

      const result = await service.getTemplate('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('renderTemplate', () => {
    it('renders template with valid variables', async () => {
      const template = createMockTemplate()
      mockGetTemplate.mockResolvedValue(template)
      mockValidateVariables.mockReturnValue({ valid: true, missing: [] })
      mockRenderTemplate.mockReturnValue({
        files: [{ path: 'README.md', content: '# My Project' }],
      })

      const result = await service.renderTemplate('test-template', { projectName: 'My Project' })

      expect(result.files).toHaveLength(1)
      expect(result.files[0]!.content).toBe('# My Project')
      expect(mockRenderTemplate).toHaveBeenCalledWith(template, { projectName: 'My Project' })
    })

    it('throws NOT_FOUND when template does not exist', async () => {
      mockGetTemplate.mockResolvedValue(null)

      await expect(service.renderTemplate('nonexistent', {}))
        .rejects.toThrow(TemplateServiceError)

      await expect(service.renderTemplate('nonexistent', {}))
        .rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('throws MISSING_VARIABLES when required variables missing', async () => {
      const template = createMockTemplate()
      mockGetTemplate.mockResolvedValue(template)
      mockValidateVariables.mockReturnValue({
        valid: false,
        missing: ['projectName', 'author'],
      })

      await expect(service.renderTemplate('test-template', {}))
        .rejects.toThrow(TemplateServiceError)

      await expect(service.renderTemplate('test-template', {}))
        .rejects.toMatchObject({ code: 'MISSING_VARIABLES' })
    })
  })

  describe('saveTemplate', () => {
    it('saves custom template', async () => {
      const template = createMockTemplate({ isBuiltIn: false })
      mockSaveTemplate.mockResolvedValue(undefined)

      await service.saveTemplate(template)

      expect(mockSaveTemplate).toHaveBeenCalledWith(template)
    })

    it('throws CANNOT_MODIFY_BUILTIN for built-in templates', async () => {
      const template = createMockTemplate({ isBuiltIn: true })

      await expect(service.saveTemplate(template))
        .rejects.toThrow(TemplateServiceError)

      await expect(service.saveTemplate(template))
        .rejects.toMatchObject({ code: 'CANNOT_MODIFY_BUILTIN' })

      expect(mockSaveTemplate).not.toHaveBeenCalled()
    })
  })

  describe('deleteTemplate', () => {
    it('deletes custom template', async () => {
      const template = createMockTemplate({ isBuiltIn: false })
      mockGetTemplate.mockResolvedValue(template)
      mockDeleteTemplate.mockResolvedValue(undefined)

      await service.deleteTemplate('test-template')

      expect(mockDeleteTemplate).toHaveBeenCalledWith('test-template')
    })

    it('throws NOT_FOUND when template does not exist', async () => {
      mockGetTemplate.mockResolvedValue(null)

      await expect(service.deleteTemplate('nonexistent'))
        .rejects.toThrow(TemplateServiceError)

      await expect(service.deleteTemplate('nonexistent'))
        .rejects.toMatchObject({ code: 'NOT_FOUND' })

      expect(mockDeleteTemplate).not.toHaveBeenCalled()
    })

    it('throws CANNOT_DELETE_BUILTIN for built-in templates', async () => {
      const template = createMockTemplate({ isBuiltIn: true })
      mockGetTemplate.mockResolvedValue(template)

      await expect(service.deleteTemplate('test-template'))
        .rejects.toThrow(TemplateServiceError)

      await expect(service.deleteTemplate('test-template'))
        .rejects.toMatchObject({ code: 'CANNOT_DELETE_BUILTIN' })

      expect(mockDeleteTemplate).not.toHaveBeenCalled()
    })
  })

  describe('validateVariables', () => {
    it('delegates to renderer', () => {
      const template = createMockTemplate()
      const variables = { projectName: 'Test' }
      mockValidateVariables.mockReturnValue({ valid: true, missing: [] })

      const result = service.validateVariables(template, variables)

      expect(mockValidateVariables).toHaveBeenCalledWith(template, variables)
      expect(result).toEqual({ valid: true, missing: [] })
    })
  })

  describe('getDefaultVariables', () => {
    it('extracts default values from template variables', () => {
      const template = createMockTemplate({
        variables: [
          { name: 'name', label: 'Name', type: 'string', required: true, default: 'Default Name' },
          { name: 'version', label: 'Version', type: 'string', required: false, default: '1.0.0' },
          { name: 'required', label: 'Required', type: 'string', required: true },
        ],
      })

      const result = service.getDefaultVariables(template)

      expect(result).toEqual({
        name: 'Default Name',
        version: '1.0.0',
      })
    })

    it('returns empty object when no defaults', () => {
      const template = createMockTemplate({
        variables: [
          { name: 'name', label: 'Name', type: 'string', required: true },
        ],
      })

      const result = service.getDefaultVariables(template)

      expect(result).toEqual({})
    })
  })

  describe('createTemplateService factory', () => {
    it('creates a TemplateService instance', () => {
      const factoryService = createTemplateService()

      expect(factoryService).toBeInstanceOf(TemplateService)
    })
  })
})

describe('TemplateServiceError', () => {
  it('has correct name and code', () => {
    const error = new TemplateServiceError('Test error', 'NOT_FOUND')

    expect(error.name).toBe('TemplateServiceError')
    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('Test error')
  })

  it('is instanceof Error', () => {
    const error = new TemplateServiceError('Test error', 'NOT_FOUND')

    expect(error).toBeInstanceOf(Error)
  })
})
