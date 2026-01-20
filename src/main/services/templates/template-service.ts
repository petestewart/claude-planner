import { TemplateLoader } from './template-loader'
import { TemplateRenderer } from './template-renderer'
import type {
  Template,
  TemplateInfo,
  RenderedTemplate,
} from '../../../shared/types/template'

/**
 * TemplateService - Main service for template operations
 */
export class TemplateService {
  private loader: TemplateLoader
  private renderer: TemplateRenderer

  constructor(customTemplatesPath?: string) {
    this.loader = new TemplateLoader(customTemplatesPath)
    this.renderer = new TemplateRenderer()
  }

  /**
   * Get the custom templates path
   */
  getCustomTemplatesPath(): string {
    return this.loader.getCustomTemplatesPath()
  }

  /**
   * Get the default custom templates path
   */
  getDefaultCustomTemplatesPath(): string {
    return this.loader.getDefaultCustomPath()
  }

  /**
   * Set a custom templates path
   */
  setCustomTemplatesPath(path: string | null): void {
    this.loader.setCustomPath(path)
  }

  /**
   * List all available templates
   */
  async listTemplates(): Promise<TemplateInfo[]> {
    return this.loader.listTemplates()
  }

  /**
   * Get a template by ID
   */
  async getTemplate(id: string): Promise<Template | null> {
    return this.loader.getTemplate(id)
  }

  /**
   * Render a template with variables
   */
  async renderTemplate(
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<RenderedTemplate> {
    const template = await this.loader.getTemplate(templateId)
    if (!template) {
      throw new TemplateServiceError(`Template not found: ${templateId}`, 'NOT_FOUND')
    }

    // Validate required variables
    const { valid, missing } = this.renderer.validateVariables(template, variables)
    if (!valid) {
      throw new TemplateServiceError(
        `Missing required variables: ${missing.join(', ')}`,
        'MISSING_VARIABLES'
      )
    }

    return this.renderer.renderTemplate(template, variables)
  }

  /**
   * Save a custom template
   */
  async saveTemplate(template: Template): Promise<void> {
    // Can't modify built-in templates
    if (template.isBuiltIn) {
      throw new TemplateServiceError(
        'Cannot modify built-in templates',
        'CANNOT_MODIFY_BUILTIN'
      )
    }

    await this.loader.saveTemplate(template)
  }

  /**
   * Delete a custom template
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = await this.loader.getTemplate(id)
    if (!template) {
      throw new TemplateServiceError(`Template not found: ${id}`, 'NOT_FOUND')
    }

    if (template.isBuiltIn) {
      throw new TemplateServiceError(
        'Cannot delete built-in templates',
        'CANNOT_DELETE_BUILTIN'
      )
    }

    await this.loader.deleteTemplate(id)
  }

  /**
   * Validate template variables
   */
  validateVariables(
    template: Template,
    variables: Record<string, unknown>
  ): { valid: boolean; missing: string[] } {
    return this.renderer.validateVariables(template, variables)
  }

  /**
   * Get default values for template variables
   */
  getDefaultVariables(template: Template): Record<string, unknown> {
    const defaults: Record<string, unknown> = {}

    for (const variable of template.variables) {
      if (variable.default !== undefined) {
        defaults[variable.name] = variable.default
      }
    }

    return defaults
  }
}

/**
 * Error codes for template service errors
 */
export type TemplateErrorCode =
  | 'NOT_FOUND'
  | 'MISSING_VARIABLES'
  | 'CANNOT_MODIFY_BUILTIN'
  | 'CANNOT_DELETE_BUILTIN'
  | 'RENDER_ERROR'
  | 'SAVE_ERROR'

/**
 * Template service error class
 */
export class TemplateServiceError extends Error {
  constructor(
    message: string,
    public code: TemplateErrorCode
  ) {
    super(message)
    this.name = 'TemplateServiceError'
  }
}

/**
 * Factory function to create template service
 */
export function createTemplateService(): TemplateService {
  return new TemplateService()
}
