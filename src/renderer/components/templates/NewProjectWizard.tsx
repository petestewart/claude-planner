import type { ReactElement } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { TemplateSelector } from './TemplateSelector'
import { TemplatePreview } from './TemplatePreview'
import { TemplateManager } from './TemplateManager'
import type { TemplateInfo, Template } from '../../../shared/types/template'
import styles from './templates.module.css'

type WizardStep = 'select-folder' | 'select-template' | 'preview-template'

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTemplateManager, setShowTemplateManager] = useState(false)

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
    }
  }, [isOpen])

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
      const path = await window.api.dir.select()
      if (path) {
        setFolderPath(path)
        setStep('select-template')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select folder')
    }
  }, [])

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
  }, [folderPath, selectedTemplateId, selectedTemplate, onProjectCreate, onClose])

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
          {step === 'select-folder' && (
            <div className={styles.folderStep}>
              <div className={styles.folderIcon}>📁</div>
              <h3 className={styles.folderTitle}>Where should we create your project?</h3>
              <p className={styles.folderDescription}>
                Choose an empty folder or a location where we can create a new project directory.
              </p>
              <button
                type="button"
                className={styles.selectFolderButton}
                onClick={handleSelectFolder}
              >
                Select Folder
              </button>
            </div>
          )}

          {/* Step 2: Select Template */}
          {step === 'select-template' && (
            <div className={styles.templateStep}>
              <div className={styles.selectedFolderInfo}>
                <span className={styles.folderPathLabel}>Project Location:</span>
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
                <span className={styles.folderPathLabel}>Project Location:</span>
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
