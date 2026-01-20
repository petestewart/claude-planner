import Handlebars from 'handlebars'
import type { Template, RenderedTemplate, RenderedFile } from '../../../shared/types/template'

/**
 * TemplateRenderer - Renders templates using Handlebars
 */
export class TemplateRenderer {
  private handlebars: typeof Handlebars

  constructor() {
    this.handlebars = Handlebars.create()
    this.registerHelpers()
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Equality check
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)

    // Not equal
    this.handlebars.registerHelper('neq', (a: unknown, b: unknown) => a !== b)

    // Greater than
    this.handlebars.registerHelper('gt', (a: unknown, b: unknown) =>
      typeof a === 'number' && typeof b === 'number' && a > b
    )

    // Less than
    this.handlebars.registerHelper('lt', (a: unknown, b: unknown) =>
      typeof a === 'number' && typeof b === 'number' && a < b
    )

    // Array contains
    this.handlebars.registerHelper('contains', (arr: unknown, val: unknown) =>
      Array.isArray(arr) && arr.includes(val)
    )

    // Array length
    this.handlebars.registerHelper('length', (arr: unknown) =>
      Array.isArray(arr) ? arr.length : 0
    )

    // Join array
    this.handlebars.registerHelper('join', (arr: unknown, sep: string) =>
      Array.isArray(arr) ? arr.join(sep) : ''
    )

    // Date formatting - current date
    this.handlebars.registerHelper('date', () =>
      new Date().toISOString().split('T')[0]
    )

    // Date formatting - ISO string
    this.handlebars.registerHelper('isoDate', () =>
      new Date().toISOString()
    )

    // Lowercase
    this.handlebars.registerHelper('lowercase', (str: unknown) =>
      typeof str === 'string' ? str.toLowerCase() : ''
    )

    // Uppercase
    this.handlebars.registerHelper('uppercase', (str: unknown) =>
      typeof str === 'string' ? str.toUpperCase() : ''
    )

    // Capitalize first letter
    this.handlebars.registerHelper('capitalize', (str: unknown) =>
      typeof str === 'string' && str.length > 0
        ? str.charAt(0).toUpperCase() + str.slice(1)
        : ''
    )

    // Convert to kebab-case
    this.handlebars.registerHelper('kebabCase', (str: unknown) =>
      typeof str === 'string'
        ? str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase()
        : ''
    )

    // Convert to camelCase
    this.handlebars.registerHelper('camelCase', (str: unknown) =>
      typeof str === 'string'
        ? str
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^(.)/, (c) => c.toLowerCase())
        : ''
    )

    // Convert to PascalCase
    this.handlebars.registerHelper('pascalCase', (str: unknown) =>
      typeof str === 'string'
        ? str
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^(.)/, (c) => c.toUpperCase())
        : ''
    )

    // If any - returns true if any element in array passes test
    this.handlebars.registerHelper('ifAny', function(
      this: unknown,
      arr: unknown,
      options: Handlebars.HelperOptions
    ) {
      if (Array.isArray(arr) && arr.length > 0) {
        return options.fn(this)
      }
      return options.inverse(this)
    })

    // Unless empty - same as ifAny
    this.handlebars.registerHelper('unlessEmpty', function(
      this: unknown,
      arr: unknown,
      options: Handlebars.HelperOptions
    ) {
      if (Array.isArray(arr) && arr.length > 0) {
        return options.fn(this)
      }
      return options.inverse(this)
    })

    // Default value
    this.handlebars.registerHelper('default', (value: unknown, defaultValue: unknown) =>
      value !== undefined && value !== null && value !== '' ? value : defaultValue
    )

    // Repeat helper - repeat block n times
    this.handlebars.registerHelper('repeat', function(
      this: Record<string, unknown>,
      n: unknown,
      options: Handlebars.HelperOptions
    ) {
      let result = ''
      const count = typeof n === 'number' ? n : parseInt(String(n), 10)
      if (!isNaN(count)) {
        for (let i = 0; i < count; i++) {
          result += options.fn({ ...this, index: i })
        }
      }
      return result
    })
  }

  /**
   * Render a single template string with variables
   */
  render(templateContent: string, variables: Record<string, unknown>): string {
    const compiled = this.handlebars.compile(templateContent)
    return compiled(variables)
  }

  /**
   * Render all files in a template
   */
  renderTemplate(
    template: Template,
    variables: Record<string, unknown>
  ): RenderedTemplate {
    const renderedFiles: RenderedFile[] = []

    for (const file of template.files) {
      const content = this.render(file.template, variables)
      const path = this.render(file.outputPath, variables)

      renderedFiles.push({ path, content })
    }

    return { files: renderedFiles }
  }

  /**
   * Validate that all required variables are provided
   */
  validateVariables(
    template: Template,
    variables: Record<string, unknown>
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = []

    for (const variable of template.variables) {
      if (variable.required && (variables[variable.name] === undefined || variables[variable.name] === '')) {
        missing.push(variable.name)
      }
    }

    return { valid: missing.length === 0, missing }
  }
}
