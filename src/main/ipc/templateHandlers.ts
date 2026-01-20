import { ipcMain } from 'electron'
import { createTemplateService } from '../services/templates'
import type { Template } from '../../shared/types/template'

const templateService = createTemplateService()

export function registerTemplateHandlers(): void {
  /**
   * List all available templates
   */
  ipcMain.handle('template:list', async () => {
    return templateService.listTemplates()
  })

  /**
   * Get a specific template by ID
   */
  ipcMain.handle('template:get', async (_event, id: string) => {
    const template = await templateService.getTemplate(id)
    if (!template) {
      throw new Error(`Template not found: ${id}`)
    }
    return template
  })

  /**
   * Save a custom template
   */
  ipcMain.handle('template:save', async (_event, template: Template) => {
    await templateService.saveTemplate(template)
  })

  /**
   * Delete a custom template
   */
  ipcMain.handle('template:delete', async (_event, id: string) => {
    await templateService.deleteTemplate(id)
  })

  /**
   * Render a template with variables
   */
  ipcMain.handle(
    'template:render',
    async (_event, templateId: string, variables: Record<string, unknown>) => {
      return templateService.renderTemplate(templateId, variables)
    }
  )

  /**
   * Get the custom templates path
   */
  ipcMain.handle('template:getCustomPath', async () => {
    return templateService.getCustomTemplatesPath()
  })

  /**
   * Get the default custom templates path
   */
  ipcMain.handle('template:getDefaultPath', async () => {
    return templateService.getDefaultCustomTemplatesPath()
  })

  /**
   * Set a custom templates path
   */
  ipcMain.handle('template:setCustomPath', async (_event, path: string | null) => {
    templateService.setCustomTemplatesPath(path)
  })
}
