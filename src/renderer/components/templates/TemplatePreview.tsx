import type { ReactElement } from 'react'
import type { Template, TemplateCategory } from '../../../shared/types/template'
import styles from './templates.module.css'

interface TemplatePreviewProps {
  /** Template to display */
  template: Template
  /** Callback when user wants to use this template */
  onUse: () => void
  /** Callback to edit template (only for custom templates) */
  onEdit?: () => void
  /** Callback to go back to selection */
  onBack?: () => void
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

/**
 * TemplatePreview - Shows detailed template information
 *
 * Features:
 * - Name, description display
 * - Files that will be generated
 * - Variables required
 * - Question flow preview
 * - "Use This Template" button
 */
export function TemplatePreview({
  template,
  onUse,
  onEdit,
  onBack,
}: TemplatePreviewProps): ReactElement {
  return (
    <div className={styles.templatePreview}>
      {/* Header */}
      <div className={styles.previewHeader}>
        <div className={styles.previewHeaderLeft}>
          <span className={styles.previewIcon}>
            {CATEGORY_ICONS[template.category]}
          </span>
          <div className={styles.previewInfo}>
            <h2 className={styles.previewTitle}>{template.name}</h2>
            <div className={styles.previewMeta}>
              <span className={styles.previewCategory}>
                {CATEGORY_LABELS[template.category]}
              </span>
              {template.author && (
                <span className={styles.previewAuthor}>
                  by {template.author}
                </span>
              )}
              <span className={styles.previewVersion}>v{template.version}</span>
            </div>
          </div>
        </div>
        <div className={styles.previewHeaderRight}>
          {onBack && (
            <button
              type="button"
              className={`${styles.previewButton} ${styles['previewButton--secondary']}`}
              onClick={onBack}
            >
              Back
            </button>
          )}
          {onEdit && !template.isBuiltIn && (
            <button
              type="button"
              className={`${styles.previewButton} ${styles['previewButton--secondary']}`}
              onClick={onEdit}
            >
              Edit
            </button>
          )}
          <button
            type="button"
            className={`${styles.previewButton} ${styles['previewButton--primary']}`}
            onClick={onUse}
          >
            Use This Template
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.previewContent}>
        {/* Description */}
        <div className={styles.previewSection}>
          <h3 className={styles.previewSectionTitle}>Description</h3>
          <p className={styles.previewDescription}>{template.description}</p>
        </div>

        {/* Files */}
        {template.files.length > 0 && (
          <div className={styles.previewSection}>
            <h3 className={styles.previewSectionTitle}>
              Files Generated ({template.files.length})
            </h3>
            <div className={styles.fileList}>
              {template.files.map((file, index) => (
                <div key={`${file.outputPath}-${index}`} className={styles.fileItem}>
                  <span className={styles.fileItemIcon}>📄</span>
                  <div className={styles.fileItemInfo}>
                    <span className={styles.fileItemPath}>{file.outputPath}</span>
                    <span className={styles.fileItemDesc}>{file.description}</span>
                  </div>
                  <span
                    className={`${styles.fileItemBadge} ${
                      file.required ? styles['fileItemBadge--required'] : ''
                    }`}
                  >
                    {file.required ? 'Required' : 'Optional'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Variables */}
        {template.variables.length > 0 && (
          <div className={styles.previewSection}>
            <h3 className={styles.previewSectionTitle}>
              Variables ({template.variables.length})
            </h3>
            <div className={styles.variableList}>
              {template.variables.map((variable) => (
                <div key={variable.name} className={styles.variableItem}>
                  <div className={styles.variableItemInfo}>
                    <span className={styles.variableItemName}>
                      {`{{${variable.name}}}`}
                    </span>
                    <span className={styles.variableItemLabel}>
                      {variable.label}
                      {variable.required && <span> *</span>}
                    </span>
                    {variable.description && (
                      <span className={styles.variableItemDesc}>
                        {variable.description}
                      </span>
                    )}
                  </div>
                  <span className={styles.variableItemType}>{variable.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Flow */}
        {template.questionFlow.length > 0 && (
          <div className={styles.previewSection}>
            <h3 className={styles.previewSectionTitle}>
              Question Flow ({template.questionFlow.length} sections)
            </h3>
            <div className={styles.questionFlowList}>
              {template.questionFlow.map((section) => (
                <div key={section.id} className={styles.questionSection}>
                  <div className={styles.questionSectionHeader}>
                    {section.title}
                    {section.condition && (
                      <span className={styles.conditionalBadge}> (Conditional)</span>
                    )}
                  </div>
                  <div className={styles.questionList}>
                    {section.questions.map((question) => (
                      <div key={question.id} className={styles.questionItem}>
                        <span className={styles.questionText}>
                          {question.text}
                          {question.required && <span className={styles.requiredMark}> *</span>}
                        </span>
                        <span className={styles.questionType}>{question.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className={styles.previewSection}>
            <h3 className={styles.previewSectionTitle}>Tags</h3>
            <div className={styles.tagsList}>
              {template.tags.map((tag) => (
                <span key={tag} className={styles.previewTag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
