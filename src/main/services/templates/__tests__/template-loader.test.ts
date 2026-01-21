/**
 * TemplateLoader unit tests
 *
 * Tests template loading with mocked file system and electron
 */

import * as fs from 'fs/promises'
import type { Template } from '../../../../shared/types/template'

// Mock electron app
jest.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: jest.fn().mockReturnValue('/user/data'),
  },
}))

// Mock fs/promises
jest.mock('fs/promises')

const mockFs = fs as jest.Mocked<typeof fs>

// Helper to create a mock Dirent-like object
interface MockDirent {
  name: string
  isDirectory: () => boolean
}

function createMockDirent(name: string, isDir: boolean): MockDirent {
  return {
    name,
    isDirectory: () => isDir,
  }
}

// Import after mocking
import { TemplateLoader } from '../template-loader'

describe('TemplateLoader', () => {
  let loader: TemplateLoader

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

  beforeEach(() => {
    jest.clearAllMocks()
    loader = new TemplateLoader()
  })

  describe('constructor', () => {
    it('uses default custom path when none provided', () => {
      expect(loader.getCustomTemplatesPath()).toBe('/user/data/templates')
    })

    it('uses provided custom path', () => {
      const customLoader = new TemplateLoader('/my/custom/path')
      expect(customLoader.getCustomTemplatesPath()).toBe('/my/custom/path')
    })
  })

  describe('setCustomPath', () => {
    it('updates custom path', () => {
      loader.setCustomPath('/new/path')
      expect(loader.getCustomTemplatesPath()).toBe('/new/path')
    })

    it('resets to default when null', () => {
      loader.setCustomPath('/new/path')
      loader.setCustomPath(null)
      expect(loader.getCustomTemplatesPath()).toBe('/user/data/templates')
    })
  })

  describe('getDefaultCustomPath', () => {
    it('returns default custom templates path', () => {
      expect(loader.getDefaultCustomPath()).toBe('/user/data/templates')
    })
  })

  describe('listTemplates', () => {
    it('lists built-in templates', async () => {
      // Mock built-in directory only (custom returns empty)
      mockFs.readdir.mockImplementation(async (dirPath) => {
        const pathStr = typeof dirPath === 'string' ? dirPath : dirPath.toString()
        // Only built-in path has templates
        if (pathStr.includes('templates') && !pathStr.includes('user')) {
          return [
            createMockDirent('standard', true),
            createMockDirent('api', true),
          ] as never
        }
        // Custom path is empty
        return []
      })

      mockFs.readFile.mockImplementation(async (filePath) => {
        const pathStr = typeof filePath === 'string' ? filePath : filePath.toString()
        if (pathStr.includes('standard')) {
          return JSON.stringify(createMockTemplate({ id: 'standard', name: 'Standard' }))
        }
        if (pathStr.includes('api')) {
          return JSON.stringify(createMockTemplate({ id: 'api', name: 'API' }))
        }
        throw new Error('ENOENT')
      })

      const templates = await loader.listTemplates()

      expect(templates).toHaveLength(2)
      expect(templates.map((t) => t.id)).toContain('standard')
      expect(templates.map((t) => t.id)).toContain('api')
    })

    it('lists custom templates', async () => {
      // Mock both built-in and custom directories
      mockFs.readdir.mockImplementation(async (dirPath) => {
        const pathStr = typeof dirPath === 'string' ? dirPath : dirPath.toString()
        if (pathStr === '/user/data/templates') {
          return [
            createMockDirent('my-custom', true),
          ] as never
        }
        // Built-in path - empty
        return []
      })

      mockFs.readFile.mockImplementation(async (filePath) => {
        const pathStr = typeof filePath === 'string' ? filePath : filePath.toString()
        if (pathStr.includes('my-custom')) {
          return JSON.stringify(createMockTemplate({ id: 'my-custom', name: 'My Custom' }))
        }
        throw new Error('ENOENT')
      })

      const templates = await loader.listTemplates()

      expect(templates).toHaveLength(1)
      expect(templates[0]!.id).toBe('my-custom')
      expect(templates[0]!.isBuiltIn).toBe(false)
    })

    it('marks built-in templates correctly', async () => {
      mockFs.readdir.mockImplementation(async (dirPath) => {
        const pathStr = typeof dirPath === 'string' ? dirPath : dirPath.toString()
        if (pathStr.includes('templates') && !pathStr.includes('user')) {
          return [
            createMockDirent('builtin', true),
          ] as never
        }
        throw new Error('ENOENT')
      })

      mockFs.readFile.mockResolvedValue(
        JSON.stringify(createMockTemplate({ id: 'builtin', name: 'Built-in' }))
      )

      const templates = await loader.listTemplates()

      expect(templates[0]!.isBuiltIn).toBe(true)
    })

    it('handles missing custom templates directory', async () => {
      mockFs.readdir.mockImplementation(async (dirPath) => {
        const pathStr = typeof dirPath === 'string' ? dirPath : dirPath.toString()
        if (pathStr.includes('user')) {
          throw new Error('ENOENT')
        }
        return []
      })

      // Should not throw
      const templates = await loader.listTemplates()
      expect(templates).toEqual([])
    })

    it('skips files (non-directories) in template directory', async () => {
      // Only built-in returns results, custom is empty
      mockFs.readdir.mockImplementation(async (dirPath) => {
        const pathStr = typeof dirPath === 'string' ? dirPath : dirPath.toString()
        if (pathStr.includes('templates') && !pathStr.includes('user')) {
          return [
            createMockDirent('valid-template', true),
            createMockDirent('README.md', false),
          ] as never
        }
        return []
      })

      mockFs.readFile.mockResolvedValue(
        JSON.stringify(createMockTemplate({ id: 'valid-template' }))
      )

      const templates = await loader.listTemplates()

      expect(templates).toHaveLength(1)
      expect(templates[0]!.id).toBe('valid-template')
    })

    it('skips directories without valid template.json', async () => {
      // Only built-in returns results, custom is empty
      mockFs.readdir.mockImplementation(async (dirPath) => {
        const pathStr = typeof dirPath === 'string' ? dirPath : dirPath.toString()
        if (pathStr.includes('templates') && !pathStr.includes('user')) {
          return [
            createMockDirent('valid', true),
            createMockDirent('invalid', true),
          ] as never
        }
        return []
      })

      mockFs.readFile.mockImplementation(async (filePath) => {
        const pathStr = typeof filePath === 'string' ? filePath : filePath.toString()
        // Only the valid template directory has template.json
        if (pathStr.includes('/valid/template.json')) {
          return JSON.stringify(createMockTemplate({ id: 'valid' }))
        }
        throw new Error('ENOENT')
      })

      const templates = await loader.listTemplates()

      expect(templates).toHaveLength(1)
      expect(templates[0]!.id).toBe('valid')
    })
  })

  describe('getTemplate', () => {
    it('returns built-in template', async () => {
      const template = createMockTemplate({ id: 'standard', isBuiltIn: true })
      mockFs.readFile.mockResolvedValue(JSON.stringify(template))

      const result = await loader.getTemplate('standard')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('standard')
      expect(result!.isBuiltIn).toBe(true)
    })

    it('returns custom template when built-in not found', async () => {
      const template = createMockTemplate({ id: 'my-custom', isBuiltIn: false })

      mockFs.readFile.mockImplementation(async (filePath) => {
        const pathStr = typeof filePath === 'string' ? filePath : filePath.toString()
        if (pathStr.includes('user')) {
          return JSON.stringify(template)
        }
        throw new Error('ENOENT')
      })

      const result = await loader.getTemplate('my-custom')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('my-custom')
      expect(result!.isBuiltIn).toBe(false)
    })

    it('returns null when template not found anywhere', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'))

      const result = await loader.getTemplate('nonexistent')

      expect(result).toBeNull()
    })

    it('loads file templates from .hbs files', async () => {
      const templateMetadata = createMockTemplate({
        id: 'with-hbs',
        files: [
          {
            outputPath: 'README.md',
            template: 'readme.hbs',
            description: 'README file',
            required: true,
          },
        ],
      })

      mockFs.readFile.mockImplementation(async (filePath) => {
        const pathStr = typeof filePath === 'string' ? filePath : filePath.toString()
        if (pathStr.endsWith('template.json')) {
          return JSON.stringify(templateMetadata)
        }
        if (pathStr.endsWith('readme.hbs')) {
          return '# {{projectName}}\n\nGenerated from .hbs file'
        }
        throw new Error('ENOENT')
      })

      const result = await loader.getTemplate('with-hbs')

      expect(result).not.toBeNull()
      expect(result!.files[0]!.template).toContain('Generated from .hbs file')
    })

    it('keeps inline template when not a .hbs path', async () => {
      const templateMetadata = createMockTemplate({
        id: 'inline',
        files: [
          {
            outputPath: 'README.md',
            template: '# Inline Template Content',
            description: 'README file',
            required: true,
          },
        ],
      })

      mockFs.readFile.mockResolvedValue(JSON.stringify(templateMetadata))

      const result = await loader.getTemplate('inline')

      expect(result!.files[0]!.template).toBe('# Inline Template Content')
    })

    it('handles missing .hbs file gracefully', async () => {
      const templateMetadata = createMockTemplate({
        id: 'missing-hbs',
        files: [
          {
            outputPath: 'README.md',
            template: 'missing.hbs',
            description: 'README file',
            required: true,
          },
        ],
      })

      mockFs.readFile.mockImplementation(async (filePath) => {
        const pathStr = typeof filePath === 'string' ? filePath : filePath.toString()
        if (pathStr.endsWith('template.json')) {
          return JSON.stringify(templateMetadata)
        }
        throw new Error('ENOENT')
      })

      const result = await loader.getTemplate('missing-hbs')

      expect(result!.files[0]!.template).toBe('missing.hbs') // Kept as-is
    })
  })

  describe('saveTemplate', () => {
    it('creates template directory and saves files', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      const template = createMockTemplate({ id: 'new-template' })

      await loader.saveTemplate(template)

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('new-template'),
        { recursive: true }
      )
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('template.json'),
        expect.any(String),
        'utf-8'
      )
    })

    it('extracts long templates to .hbs files', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      const longContent = 'x'.repeat(600) // Longer than 500 chars
      const template = createMockTemplate({
        id: 'long-template',
        files: [
          {
            outputPath: 'README.md',
            template: longContent,
            description: 'Long file',
            required: true,
          },
        ],
      })

      await loader.saveTemplate(template)

      // Should write the .hbs file
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.hbs$/),
        longContent,
        'utf-8'
      )
    })

    it('ensures custom templates directory exists', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      const template = createMockTemplate({ id: 'test' })

      await loader.saveTemplate(template)

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('/user/data/templates'),
        { recursive: true }
      )
    })

    it('sets isBuiltIn to false when saving', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      const template = createMockTemplate({ id: 'test', isBuiltIn: true })

      await loader.saveTemplate(template)

      const writeCall = mockFs.writeFile.mock.calls.find(
        (call) => String(call[0]).endsWith('template.json')
      )
      expect(writeCall).toBeDefined()

      const savedContent = JSON.parse(writeCall![1] as string)
      expect(savedContent.isBuiltIn).toBe(false)
    })
  })

  describe('deleteTemplate', () => {
    it('removes template directory recursively', async () => {
      mockFs.rm.mockResolvedValue(undefined)

      await loader.deleteTemplate('my-template')

      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringContaining('my-template'),
        { recursive: true, force: true }
      )
    })
  })

  describe('ensureCustomTemplatesDir', () => {
    it('creates custom templates directory', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)

      await loader.ensureCustomTemplatesDir()

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        '/user/data/templates',
        { recursive: true }
      )
    })
  })
})
