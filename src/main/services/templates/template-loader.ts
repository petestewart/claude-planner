import * as fs from 'fs/promises'
import * as path from 'path'
import { app } from 'electron'
import type { Template, TemplateInfo } from '../../../shared/types/template'

/**
 * TemplateLoader - Loads templates from built-in and custom locations
 */
export class TemplateLoader {
  private builtInPath: string
  private customPath: string
  private defaultCustomPath: string

  constructor(customPath?: string) {
    // Built-in templates are bundled with the app
    this.builtInPath = app.isPackaged
      ? path.join(process.resourcesPath, 'templates')
      : path.join(__dirname, '../../../../templates')

    // Default custom templates location in user data
    this.defaultCustomPath = path.join(app.getPath('userData'), 'templates')

    // Custom path can be overridden
    this.customPath = customPath || this.defaultCustomPath
  }

  /**
   * Set a custom templates path
   */
  setCustomPath(customPath: string | null): void {
    this.customPath = customPath || this.defaultCustomPath
  }

  /**
   * Get the default custom templates path
   */
  getDefaultCustomPath(): string {
    return this.defaultCustomPath
  }

  /**
   * List all available templates (built-in and custom)
   */
  async listTemplates(): Promise<TemplateInfo[]> {
    const templates: TemplateInfo[] = []

    // Load built-in templates
    const builtIn = await this.loadTemplatesFromPath(this.builtInPath, true)
    templates.push(...builtIn)

    // Load custom templates
    try {
      const custom = await this.loadTemplatesFromPath(this.customPath, false)
      templates.push(...custom)
    } catch {
      // Custom templates directory may not exist yet
    }

    return templates
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<Template | null> {
    // Check built-in templates first
    const builtInTemplate = await this.loadTemplate(
      path.join(this.builtInPath, id),
      true
    )
    if (builtInTemplate) {
      return builtInTemplate
    }

    // Check custom templates
    const customTemplate = await this.loadTemplate(
      path.join(this.customPath, id),
      false
    )
    return customTemplate
  }

  /**
   * Load templates from a directory
   */
  private async loadTemplatesFromPath(
    basePath: string,
    isBuiltIn: boolean
  ): Promise<TemplateInfo[]> {
    const templates: TemplateInfo[] = []

    try {
      const entries = await fs.readdir(basePath, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const templatePath = path.join(basePath, entry.name)
          const info = await this.loadTemplateInfo(templatePath, isBuiltIn)
          if (info) {
            templates.push(info)
          }
        }
      }
    } catch {
      // Directory doesn't exist or isn't accessible
    }

    return templates
  }

  /**
   * Load template info from a template directory
   */
  private async loadTemplateInfo(
    templatePath: string,
    isBuiltIn: boolean
  ): Promise<TemplateInfo | null> {
    try {
      const metadataPath = path.join(templatePath, 'template.json')
      const content = await fs.readFile(metadataPath, 'utf-8')
      const metadata = JSON.parse(content) as Template

      return {
        id: metadata.id,
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        isBuiltIn,
        tags: metadata.tags || [],
      }
    } catch {
      return null
    }
  }

  /**
   * Load a full template from its directory
   */
  private async loadTemplate(
    templatePath: string,
    isBuiltIn: boolean
  ): Promise<Template | null> {
    try {
      const metadataPath = path.join(templatePath, 'template.json')
      const content = await fs.readFile(metadataPath, 'utf-8')
      const metadata = JSON.parse(content) as Template

      // Load template file contents
      const filesWithContent = await Promise.all(
        metadata.files.map(async (file) => {
          // Check if template is a file path (.hbs) or inline content
          if (file.template.endsWith('.hbs')) {
            const templateFilePath = path.join(templatePath, file.template)
            try {
              const templateContent = await fs.readFile(templateFilePath, 'utf-8')
              return { ...file, template: templateContent }
            } catch {
              // File not found, return as-is
              return file
            }
          }
          return file
        })
      )

      return {
        ...metadata,
        isBuiltIn,
        files: filesWithContent,
      }
    } catch {
      return null
    }
  }

  /**
   * Get the custom templates path for saving
   */
  getCustomTemplatesPath(): string {
    return this.customPath
  }

  /**
   * Ensure custom templates directory exists
   */
  async ensureCustomTemplatesDir(): Promise<void> {
    await fs.mkdir(this.customPath, { recursive: true })
  }

  /**
   * Save a custom template
   */
  async saveTemplate(template: Template): Promise<void> {
    await this.ensureCustomTemplatesDir()

    const templateDir = path.join(this.customPath, template.id)
    await fs.mkdir(templateDir, { recursive: true })

    // Separate template files from metadata
    const filesToWrite: { filename: string; content: string }[] = []
    const metadataFiles = template.files.map((file) => {
      // If template is inline content (long), save to .hbs file
      if (file.template.length > 500 && !file.template.endsWith('.hbs')) {
        const filename = file.outputPath.replace(/\//g, '-').replace(/\./g, '-') + '.hbs'
        filesToWrite.push({ filename, content: file.template })
        return { ...file, template: filename }
      }
      return file
    })

    // Write template files
    for (const { filename, content } of filesToWrite) {
      await fs.writeFile(path.join(templateDir, filename), content, 'utf-8')
    }

    // Write metadata
    const metadata = { ...template, files: metadataFiles, isBuiltIn: false }
    await fs.writeFile(
      path.join(templateDir, 'template.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    )
  }

  /**
   * Delete a custom template
   */
  async deleteTemplate(id: string): Promise<void> {
    const templateDir = path.join(this.customPath, id)
    await fs.rm(templateDir, { recursive: true, force: true })
  }
}
