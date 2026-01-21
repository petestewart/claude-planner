import type { ReactElement } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { TemplateSelector } from './TemplateSelector'
import { TemplatePreview } from './TemplatePreview'
import { TemplateManager } from './TemplateManager'
import type { TemplateInfo, Template } from '../../../shared/types/template'
import styles from './templates.module.css'

/**
 * Browser-safe path join for display purposes.
 * Works for both Unix-style and Windows-style paths by detecting the separator
 * from the parent path.
 */
function joinPath(parentPath: string, childName: string): string {
  // Detect the path separator from the parent path
  const separator = parentPath.includes('\\') ? '\\' : '/'
  // Remove trailing separator from parent if present
  const cleanParent = parentPath.endsWith(separator)
    ? parentPath.slice(0, -1)
    : parentPath
  return `${cleanParent}${separator}${childName}`
}

type WizardStep = 'select-folder' | 'select-template' | 'preview-template'
type FolderMode = 'select' | 'create'

interface NewProjectWizardProps {
  /** Whether the wizard is open */
  isOpen: boolean
  /** Callback when wizard is closed */
  onClose: () => void
  /** Callback when project is created */
  onProjectCreate: (config: NewProjectConfig) => void
}

export interface NewProjectConfig {
  /** Path to the project folder */
  folderPath: string
  /** Selected template ID */
  templateId: string
  /** Full template data */
  template: Template
}

/**
 * NewProjectWizard - Multi-step wizard for creating new projects
 *
 * Steps:
 * 1. Select folder location
 * 2. Choose a template
 * 3. Preview and confirm
 */
export function NewProjectWizard({
  isOpen,
  onClose,
  onProjectCreate,
}: NewProjectWizardProps): ReactElement | null {
  const [step, setStep] = useState<WizardStep>('select-folder')
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  )
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [folderMode, setFolderMode] = useState<FolderMode>('select')
  const [parentFolderPath, setParentFolderPath] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  // Load templates when wizard opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  // Reset state when wizard closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select-folder')
      setFolderPath(null)
      setSelectedTemplateId(null)
      setSelectedTemplate(null)
      setError(null)
      setFolderMode('select')
      setParentFolderPath(null)
      setNewFolderName('')
    }
  }, [isOpen])

  // Handle Escape key to close wizard
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const loadTemplates = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const templateList = await window.api.template.list()
      setTemplates(templateList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectFolder = useCallback(async () => {
    try {
      const selectedPath = await window.api.dir.select()
      if (selectedPath) {
        setFolderPath(selectedPath)
        setStep('select-template')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select folder')
    }
  }, [])

  const handleStartCreateFolder = useCallback(() => {
    setFolderMode('create')
    setError(null)
  }, [])

  const handleCancelCreateFolder = useCallback(() => {
    setFolderMode('select')
    setParentFolderPath(null)
    setNewFolderName('')
    setError(null)
  }, [])

  const handleSelectParentFolder = useCallback(async () => {
    try {
      const selectedPath = await window.api.dir.select()
      if (selectedPath) {
        setParentFolderPath(selectedPath)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to select parent folder'
      )
    }
  }, [])

  const handleCreateFolder = useCallback(async () => {
    if (!parentFolderPath || !newFolderName.trim()) {
      setError('Please select a parent folder and enter a folder name')
      return
    }

    // Validate folder name (no path separators or invalid characters)
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
    if (invalidChars.test(newFolderName)) {
      setError('Folder name contains invalid characters')
      return
    }

    setIsCreatingFolder(true)
    setError(null)

    try {
      const newPath = joinPath(parentFolderPath, newFolderName.trim())
      await window.api.dir.create(newPath)
      setFolderPath(newPath)
      setFolderMode('select')
      setParentFolderPath(null)
      setNewFolderName('')
      setStep('select-template')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
    } finally {
      setIsCreatingFolder(false)
    }
  }, [parentFolderPath, newFolderName])

  const handleTemplateSelect = useCallback(async (templateId: string) => {
    setSelectedTemplateId(templateId)
    setIsLoading(true)
    setError(null)
    try {
      const template = await window.api.template.get(templateId)
      setSelectedTemplate(template)
      setStep('preview-template')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleBack = useCallback(() => {
    if (step === 'preview-template') {
      setStep('select-template')
      setSelectedTemplate(null)
    } else if (step === 'select-template') {
      setStep('select-folder')
      setFolderPath(null)
    }
  }, [step])

  const handleCreateProject = useCallback(() => {
    if (folderPath && selectedTemplateId && selectedTemplate) {
      onProjectCreate({
        folderPath,
        templateId: selectedTemplateId,
        template: selectedTemplate,
      })
      onClose()
    }
  }, [
    folderPath,
    selectedTemplateId,
    selectedTemplate,
    onProjectCreate,
    onClose,
  ])

  const handleManageTemplates = useCallback(() => {
    setShowTemplateManager(true)
  }, [])

  const handleCloseTemplateManager = useCallback(() => {
    setShowTemplateManager(false)
    // Refresh templates list after closing manager
    loadTemplates()
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.wizardOverlay} onClick={onClose}>
      <div
        className={styles.wizardModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
      >
        {/* Header */}
        <div className={styles.wizardHeader}>
          <h2 id="wizard-title" className={styles.wizardTitle}>
            {step === 'select-folder' && 'New Project - Select Location'}
            {step === 'select-template' && 'New Project - Choose Template'}
            {step === 'preview-template' && 'New Project - Review & Create'}
          </h2>
          <button
            type="button"
            className={styles.wizardCloseButton}
            onClick={onClose}
            aria-label="Close wizard"
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className={styles.stepIndicator}>
          <div
            className={`${styles.step} ${step === 'select-folder' ? styles['step--active'] : ''} ${
              folderPath ? styles['step--complete'] : ''
            }`}
          >
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>Location</span>
          </div>
          <div className={styles.stepConnector} />
          <div
            className={`${styles.step} ${step === 'select-template' ? styles['step--active'] : ''} ${
              selectedTemplateId ? styles['step--complete'] : ''
            }`}
          >
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>Template</span>
          </div>
          <div className={styles.stepConnector} />
          <div
            className={`${styles.step} ${step === 'preview-template' ? styles['step--active'] : ''}`}
          >
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>Create</span>
          </div>
        </div>

        {/* Content */}
        <div className={styles.wizardContent}>
          {error && (
            <div className={styles.wizardError}>
              <span>Error: {error}</span>
              <button type="button" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          {/* Step 1: Select Folder */}
          {step === 'select-folder' && folderMode === 'select' && (
            <div className={styles.folderStep}>
              <div className={styles.folderIcon}>📁</div>
              <h3 className={styles.folderTitle}>
                Where should we create your project?
              </h3>
              <p className={styles.folderDescription}>
                Choose an existing folder or create a new one for your project.
              </p>
              <div className={styles.folderButtons}>
                <button
                  type="button"
                  className={styles.selectFolderButton}
                  onClick={handleSelectFolder}
                >
                  Select Existing Folder
                </button>
                <button
                  type="button"
                  className={styles.createFolderButton}
                  onClick={handleStartCreateFolder}
                >
                  Create New Folder
                </button>
              </div>
            </div>
          )}

          {/* Step 1b: Create New Folder */}
          {step === 'select-folder' && folderMode === 'create' && (
            <div className={styles.folderStep}>
              <div className={styles.folderIcon}>📁</div>
              <h3 className={styles.folderTitle}>
                Create a new project folder
              </h3>
              <p className={styles.folderDescription}>
                Select a parent directory and enter a name for your new folder.
              </p>
              <div className={styles.createFolderForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Parent Directory</label>
                  <div className={styles.parentFolderSelect}>
                    <span className={styles.parentFolderPath}>
                      {parentFolderPath || 'No folder selected'}
                    </span>
                    <button
                      type="button"
                      className={styles.browseButton}
                      onClick={handleSelectParentFolder}
                    >
                      Browse...
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="newFolderName">
                    Folder Name
                  </label>
                  <input
                    id="newFolderName"
                    type="text"
                    className={styles.formInput}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="my-project"
                    disabled={isCreatingFolder}
                  />
                </div>
                {parentFolderPath && newFolderName && (
                  <div className={styles.folderPreview}>
                    <span className={styles.folderPreviewLabel}>
                      Will create:
                    </span>
                    <span className={styles.folderPreviewPath}>
                      {joinPath(parentFolderPath, newFolderName.trim())}
                    </span>
                  </div>
                )}
                <div className={styles.createFolderActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancelCreateFolder}
                    disabled={isCreatingFolder}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.selectFolderButton}
                    onClick={handleCreateFolder}
                    disabled={
                      !parentFolderPath ||
                      !newFolderName.trim() ||
                      isCreatingFolder
                    }
                  >
                    {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Template */}
          {step === 'select-template' && (
            <div className={styles.templateStep}>
              <div className={styles.selectedFolderInfo}>
                <span className={styles.folderPathLabel}>
                  Project Location:
                </span>
                <span className={styles.folderPathValue}>{folderPath}</span>
                <button
                  type="button"
                  className={styles.changeFolderButton}
                  onClick={handleBack}
                >
                  Change
                </button>
              </div>
              <TemplateSelector
                templates={templates}
                selectedId={selectedTemplateId}
                onSelect={handleTemplateSelect}
                onManageTemplates={handleManageTemplates}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Step 3: Preview Template */}
          {step === 'preview-template' && selectedTemplate && (
            <div className={styles.previewStep}>
              <div className={styles.selectedFolderInfo}>
                <span className={styles.folderPathLabel}>
                  Project Location:
                </span>
                <span className={styles.folderPathValue}>{folderPath}</span>
              </div>
              <TemplatePreview
                template={selectedTemplate}
                onUse={handleCreateProject}
                onBack={handleBack}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.wizardFooter}>
          {step !== 'select-folder' && (
            <button
              type="button"
              className={styles.wizardBackButton}
              onClick={handleBack}
            >
              Back
            </button>
          )}
          <button
            type="button"
            className={styles.wizardCancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Template Manager Modal */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={handleCloseTemplateManager}
      />
    </div>
  )
}
