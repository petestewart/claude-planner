import { TemplateRenderer } from '../template-renderer'
import type { Template } from '../../../../shared/types/template'

describe('TemplateRenderer', () => {
  let renderer: TemplateRenderer

  beforeEach(() => {
    renderer = new TemplateRenderer()
  })

  describe('render', () => {
    it('renders basic variable substitution', () => {
      const result = renderer.render('Hello, {{name}}!', { name: 'World' })
      expect(result).toBe('Hello, World!')
    })

    it('renders nested objects', () => {
      const result = renderer.render('{{project.name}} by {{project.author}}', {
        project: { name: 'Test', author: 'Developer' },
      })
      expect(result).toBe('Test by Developer')
    })

    it('handles missing variables gracefully', () => {
      const result = renderer.render('Hello, {{name}}!', {})
      expect(result).toBe('Hello, !')
    })
  })

  describe('helpers', () => {
    describe('eq', () => {
      it('returns true when values are equal', () => {
        const result = renderer.render('{{#if (eq a b)}}equal{{/if}}', { a: 1, b: 1 })
        expect(result).toBe('equal')
      })

      it('returns false when values are not equal', () => {
        const result = renderer.render('{{#if (eq a b)}}equal{{else}}not equal{{/if}}', { a: 1, b: 2 })
        expect(result).toBe('not equal')
      })
    })

    describe('neq', () => {
      it('returns true when values are not equal', () => {
        const result = renderer.render('{{#if (neq a b)}}different{{/if}}', { a: 1, b: 2 })
        expect(result).toBe('different')
      })
    })

    describe('contains', () => {
      it('returns true when array contains value', () => {
        const result = renderer.render('{{#if (contains arr val)}}found{{/if}}', {
          arr: [1, 2, 3],
          val: 2,
        })
        expect(result).toBe('found')
      })

      it('returns false when array does not contain value', () => {
        const result = renderer.render('{{#if (contains arr val)}}found{{else}}not found{{/if}}', {
          arr: [1, 2, 3],
          val: 5,
        })
        expect(result).toBe('not found')
      })
    })

    describe('join', () => {
      it('joins array elements', () => {
        const result = renderer.render('{{join items ", "}}', {
          items: ['a', 'b', 'c'],
        })
        expect(result).toBe('a, b, c')
      })

      it('returns empty string for non-array', () => {
        const result = renderer.render('{{join items ", "}}', { items: 'not array' })
        expect(result).toBe('')
      })
    })

    describe('length', () => {
      it('returns array length', () => {
        const result = renderer.render('{{length items}}', { items: [1, 2, 3] })
        expect(result).toBe('3')
      })
    })

    describe('lowercase', () => {
      it('converts to lowercase', () => {
        const result = renderer.render('{{lowercase text}}', { text: 'HELLO' })
        expect(result).toBe('hello')
      })
    })

    describe('uppercase', () => {
      it('converts to uppercase', () => {
        const result = renderer.render('{{uppercase text}}', { text: 'hello' })
        expect(result).toBe('HELLO')
      })
    })

    describe('capitalize', () => {
      it('capitalizes first letter', () => {
        const result = renderer.render('{{capitalize text}}', { text: 'hello' })
        expect(result).toBe('Hello')
      })
    })

    describe('kebabCase', () => {
      it('converts to kebab-case', () => {
        const result = renderer.render('{{kebabCase text}}', { text: 'Hello World' })
        expect(result).toBe('hello-world')
      })

      it('handles camelCase', () => {
        const result = renderer.render('{{kebabCase text}}', { text: 'helloWorld' })
        expect(result).toBe('hello-world')
      })
    })

    describe('camelCase', () => {
      it('converts to camelCase', () => {
        const result = renderer.render('{{camelCase text}}', { text: 'hello-world' })
        expect(result).toBe('helloWorld')
      })
    })

    describe('pascalCase', () => {
      it('converts to PascalCase', () => {
        const result = renderer.render('{{pascalCase text}}', { text: 'hello-world' })
        expect(result).toBe('HelloWorld')
      })
    })

    describe('default', () => {
      it('returns value when present', () => {
        const result = renderer.render('{{default name "Anonymous"}}', { name: 'John' })
        expect(result).toBe('John')
      })

      it('returns default when value is missing', () => {
        const result = renderer.render('{{default name "Anonymous"}}', {})
        expect(result).toBe('Anonymous')
      })

      it('returns default when value is empty string', () => {
        const result = renderer.render('{{default name "Anonymous"}}', { name: '' })
        expect(result).toBe('Anonymous')
      })
    })

    describe('date', () => {
      it('returns current date in ISO format', () => {
        const result = renderer.render('{{date}}', {})
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    describe('ifAny', () => {
      it('renders block when array has elements', () => {
        const result = renderer.render('{{#ifAny items}}has items{{/ifAny}}', {
          items: [1, 2],
        })
        expect(result).toBe('has items')
      })

      it('renders else block when array is empty', () => {
        const result = renderer.render('{{#ifAny items}}has items{{else}}empty{{/ifAny}}', {
          items: [],
        })
        expect(result).toBe('empty')
      })
    })

    describe('repeat', () => {
      it('repeats block n times', () => {
        const result = renderer.render('{{#repeat 3}}x{{/repeat}}', {})
        expect(result).toBe('xxx')
      })

      it('provides index in context', () => {
        const result = renderer.render('{{#repeat 3}}{{index}}{{/repeat}}', {})
        expect(result).toBe('012')
      })
    })
  })

  describe('renderTemplate', () => {
    const createMockTemplate = (): Template => ({
      id: 'test',
      name: 'Test Template',
      description: 'A test template',
      category: 'other',
      isBuiltIn: true,
      tags: [],
      version: '1.0.0',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      files: [
        {
          outputPath: 'README.md',
          template: '# {{projectName}}\n\n{{description}}',
          description: 'Project README',
          required: true,
        },
        {
          outputPath: 'src/{{kebabCase projectName}}.ts',
          template: '// {{projectName}} implementation',
          description: 'Main source file',
          required: true,
        },
      ],
      variables: [
        { name: 'projectName', label: 'Project Name', type: 'string', required: true },
        { name: 'description', label: 'Description', type: 'string', required: false },
      ],
      questionFlow: [],
      defaultGenerationMode: 'incremental',
    })

    it('renders all files in template', () => {
      const template = createMockTemplate()
      const result = renderer.renderTemplate(template, {
        projectName: 'My Project',
        description: 'A cool project',
      })

      expect(result.files).toHaveLength(2)
      expect(result.files[0]!.path).toBe('README.md')
      expect(result.files[0]!.content).toBe('# My Project\n\nA cool project')
      expect(result.files[1]!.path).toBe('src/my-project.ts')
      expect(result.files[1]!.content).toBe('// My Project implementation')
    })

    it('renders output paths with variables', () => {
      const template = createMockTemplate()
      const result = renderer.renderTemplate(template, {
        projectName: 'HelloWorld',
      })

      expect(result.files[1]!.path).toBe('src/hello-world.ts')
    })
  })

  describe('validateVariables', () => {
    const createMockTemplate = (): Template => ({
      id: 'test',
      name: 'Test',
      description: 'Test',
      category: 'other',
      isBuiltIn: true,
      tags: [],
      version: '1.0.0',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      files: [],
      variables: [
        { name: 'required1', label: 'Required 1', type: 'string', required: true },
        { name: 'required2', label: 'Required 2', type: 'string', required: true },
        { name: 'optional', label: 'Optional', type: 'string', required: false },
      ],
      questionFlow: [],
      defaultGenerationMode: 'incremental',
    })

    it('returns valid when all required variables present', () => {
      const template = createMockTemplate()
      const result = renderer.validateVariables(template, {
        required1: 'value1',
        required2: 'value2',
      })

      expect(result.valid).toBe(true)
      expect(result.missing).toEqual([])
    })

    it('returns invalid when required variables missing', () => {
      const template = createMockTemplate()
      const result = renderer.validateVariables(template, {
        required1: 'value1',
      })

      expect(result.valid).toBe(false)
      expect(result.missing).toEqual(['required2'])
    })

    it('treats empty string as missing', () => {
      const template = createMockTemplate()
      const result = renderer.validateVariables(template, {
        required1: 'value1',
        required2: '',
      })

      expect(result.valid).toBe(false)
      expect(result.missing).toEqual(['required2'])
    })
  })
})
