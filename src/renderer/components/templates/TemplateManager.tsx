import type { ReactElement } from 'react'
import { useState, useEffect, useCallback } from 'react'
import type { TemplateInfo, Template, TemplateCategory } from '../../../shared/types/template'
import styles from './templates.module.css'

interface TemplateManagerProps {
  /** Whether the manager modal is open */
  isOpen: boolean
  /** Callback when manager is closed */
  onClose: () => void
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  'web-app': 'Web App',
  'cli-tool': 'CLI Tool',
  'library': 'Library',
  'api-service': 'API Service',
  'mobile-app': 'Mobile App',
  'desktop-app': 'Desktop App',
  'other': 'Other',
}

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  'web-app': '🌐',
  'cli-tool': '⌨️',
  'library': '📦',
  'api-service': '🔌',
  'mobile-app': '📱',
  'desktop-app': '🖥️',
  'other': '📄',
}

type ManagerView = 'list' | 'create' | 'edit'

interface CreateTemplateForm {
  name: string
  description: string
  category: TemplateCategory
  baseTemplateId: string | null
}

/**
 * TemplateManager - Modal for managing custom templates
 *
 * Features:
 * - List custom templates
 * - Create new template (copy from built-in)
 * - Edit template metadata
 * - Delete template
 * - Import/Export templates
 */
export function TemplateManager({
  isOpen,
  onClose,
}: TemplateManagerProps): ReactElement | null {
  const [view, setView] = useState<ManagerView>('list')
  const [builtInTemplates, setBuiltInTemplates] = useState<TemplateInfo[]>([])
  const [customTemplates, setCustomTemplates] = useState<TemplateInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPath, setCustomPath] = useState<string>('')

  // Create template form state
  const [createForm, setCreateForm] = useState<CreateTemplateForm>({
    name: '',
    description: '',
    category: 'other',
    baseTemplateId: null,
  })

  // Load templates and custom path when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      loadCustomPath()
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setView('list')
      setError(null)
      setCreateForm({
        name: '',
        description: '',
        category: 'other',
        baseTemplateId: null,
      })
    }
  }, [isOpen])

  const loadTemplates = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const templateList = await window.api.template.list()
      setBuiltInTemplates(templateList.filter((t) => t.isBuiltIn))
      setCustomTemplates(templateList.filter((t) => !t.isBuiltIn))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCustomPath = async (): Promise<void> => {
    try {
      const path = await window.api.template.getCustomPath()
      setCustomPath(path)
    } catch (err) {
      console.error('Failed to load custom path:', err)
    }
  }

  const handleCreateTemplate = useCallback(async () => {
    if (!createForm.name.trim()) {
      setError('Template name is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let baseTemplate: Template | null = null

      // Load base template if selected
      if (createForm.baseTemplateId) {
        baseTemplate = await window.api.template.get(createForm.baseTemplateId)
      }

      // Generate ID from name
      const id = createForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Create new template
      const now = new Date().toISOString()
      const newTemplate: Template = {
        id,
        name: createForm.name,
        description: createForm.description || `Custom template: ${createForm.name}`,
        category: createForm.category,
        isBuiltIn: false,
        tags: ['custom'],
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        files: baseTemplate?.files || [],
        variables: baseTemplate?.variables || [],
        questionFlow: baseTemplate?.questionFlow || [],
        defaultGenerationMode: baseTemplate?.defaultGenerationMode || 'incremental',
      }

      await window.api.template.save(newTemplate)
      await loadTemplates()
      setView('list')
      setCreateForm({
        name: '',
        description: '',
        category: 'other',
        baseTemplateId: null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setIsLoading(false)
    }
  }, [createForm])

  const handleDeleteTemplate = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await window.api.template.delete(id)
      await loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleExportTemplate = useCallback(async (template: TemplateInfo) => {
    try {
      const fullTemplate = await window.api.template.get(template.id)

      // Create a JSON blob and download it
      const blob = new Blob([JSON.stringify(fullTemplate, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.id}.template.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export template')
    }
  }, [])

  const handleImportTemplate = useCallback(async () => {
    // Create file input for import
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.template.json'

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      setIsLoading(true)
      setError(null)

      try {
        const content = await file.text()
        const template = JSON.parse(content) as Template

        // Validate required fields
        if (!template.id || !template.name) {
          throw new Error('Invalid template file: missing required fields')
        }

        // Mark as custom template
        template.isBuiltIn = false
        template.updatedAt = new Date().toISOString()

        await window.api.template.save(template)
        await loadTemplates()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import template')
      } finally {
        setIsLoading(false)
      }
    }

    input.click()
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.templateManager} onClick={onClose}>
      <div
        className={styles.managerModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-title"
      >
        {/* Header */}
        <div className={styles.managerHeader}>
          <h2 id="manager-title" className={styles.managerTitle}>
            {view === 'list' && 'Manage Templates'}
            {view === 'create' && 'Create New Template'}
            {view === 'edit' && 'Edit Template'}
          </h2>
          <button
            type="button"
            className={styles.managerCloseButton}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.managerContent}>
          {error && (
            <div className={styles.wizardError}>
              <span>Error: {error}</span>
              <button type="button" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <span>Loading...</span>
            </div>
          )}

          {/* List View */}
          {view === 'list' && !isLoading && (
            <>
              {/* Actions */}
              <div className={styles.managerActions}>
                <button
                  type="button"
                  className={styles.managerActionButton}
                  onClick={() => setView('create')}
                >
                  <span>➕</span>
                  <span>Create New</span>
                </button>
                <button
                  type="button"
                  className={styles.managerActionButton}
                  onClick={handleImportTemplate}
                >
                  <span>📥</span>
                  <span>Import</span>
                </button>
              </div>

              {/* Custom path info */}
              <div className={styles.customPathInfo}>
                <span className={styles.customPathLabel}>Custom templates location:</span>
                <span className={styles.customPathValue}>{customPath}</span>
              </div>

              {/* Custom Templates List */}
              {customTemplates.length > 0 ? (
                <div className={styles.managerTemplateList}>
                  {customTemplates.map((template) => (
                    <div key={template.id} className={styles.managerTemplateItem}>
                      <span className={styles.managerTemplateIcon}>
                        {CATEGORY_ICONS[template.category]}
                      </span>
                      <div className={styles.managerTemplateInfo}>
                        <span className={styles.managerTemplateName}>{template.name}</span>
                        <span className={styles.managerTemplateDesc}>
                          {template.description}
                        </span>
                      </div>
                      <div className={styles.managerTemplateActions}>
                        <button
                          type="button"
                          className={styles.managerItemButton}
                          onClick={() => handleExportTemplate(template)}
                          title="Export template"
                        >
                          Export
                        </button>
                        <button
                          type="button"
                          className={`${styles.managerItemButton} ${styles['managerItemButton--danger']}`}
                          onClick={() => handleDeleteTemplate(template.id)}
                          title="Delete template"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.managerEmpty}>
                  <span className={styles.managerEmptyIcon}>📭</span>
                  <p className={styles.managerEmptyText}>
                    No custom templates yet. Create one or import from a file.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Create View */}
          {view === 'create' && !isLoading && (
            <div className={styles.createForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="template-name">
                  Template Name *
                </label>
                <input
                  id="template-name"
                  type="text"
                  className={styles.formInput}
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="My Custom Template"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="template-description">
                  Description
                </label>
                <textarea
                  id="template-description"
                  className={styles.formTextarea}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="A brief description of what this template is for"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="template-category">
                  Category
                </label>
                <select
                  id="template-category"
                  className={styles.formSelect}
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      category: e.target.value as TemplateCategory,
                    }))
                  }
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="base-template">
                  Base Template (optional)
                </label>
                <p className={styles.formHint}>
                  Start with files and settings from an existing template
                </p>
                <select
                  id="base-template"
                  className={styles.formSelect}
                  value={createForm.baseTemplateId || ''}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      baseTemplateId: e.target.value || null,
                    }))
                  }
                >
                  <option value="">Start from scratch</option>
                  <optgroup label="Built-in Templates">
                    {builtInTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                  {customTemplates.length > 0 && (
                    <optgroup label="Custom Templates">
                      {customTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.formButtonSecondary}
                  onClick={() => setView('list')}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.formButtonPrimary}
                  onClick={handleCreateTemplate}
                  disabled={!createForm.name.trim()}
                >
                  Create Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
