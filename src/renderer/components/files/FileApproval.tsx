import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import type { GeneratedFile } from '../../../shared/types/project'
import styles from './FileApproval.module.css'

/**
 * FileApprovalItem - Shows a single file pending approval
 */
function FileApprovalItem({
  file,
  onApprove,
  onReject,
  onView,
}: {
  file: GeneratedFile
  onApprove: (path: string) => void
  onReject: (path: string) => void
  onView: (path: string) => void
}): ReactElement {
  const fileName = file.path.split('/').pop() ?? file.path
  const statusClass =
    file.status === 'draft'
      ? styles.statusDraft
      : file.status === 'approved'
        ? styles.statusApproved
        : styles.statusModified

  return (
    <div className={styles.fileItem}>
      <div className={styles.fileInfo}>
        <span className={styles.fileName} title={file.path}>
          {fileName}
        </span>
        <span className={`${styles.fileStatus} ${statusClass}`}>
          {file.status}
        </span>
      </div>
      <div className={styles.fileActions}>
        <button
          type="button"
          className={styles.viewButton}
          onClick={() => onView(file.path)}
          title="View file"
        >
          View
        </button>
        {file.status === 'draft' && (
          <>
            <button
              type="button"
              className={styles.approveButton}
              onClick={() => onApprove(file.path)}
              title="Approve file"
            >
              Approve
            </button>
            <button
              type="button"
              className={styles.rejectButton}
              onClick={() => onReject(file.path)}
              title="Request changes"
            >
              Revise
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export interface FileApprovalProps {
  /** Called when a file should be viewed in the editor */
  onViewFile?: (path: string) => void
  /** Whether to show only pending files or all files */
  showAll?: boolean
}

/**
 * FileApproval - Shows files pending approval in incremental mode
 *
 * Displays generated files with their status and allows:
 * - Approving draft files
 * - Requesting revisions (rejects and prompts for changes)
 * - Viewing files in the editor
 */
export function FileApproval({
  onViewFile,
  showAll = false,
}: FileApprovalProps): ReactElement | null {
  const generatedFiles = useProjectStore(
    (state) => state.project?.generatedFiles ?? []
  )
  const generationMode = useProjectStore(
    (state) => state.project?.generationMode ?? 'incremental'
  )
  const updateGeneratedFile = useProjectStore(
    (state) => state.updateGeneratedFile
  )
  const removeGeneratedFile = useProjectStore(
    (state) => state.removeGeneratedFile
  )

  const handleApprove = useCallback(
    (path: string) => {
      updateGeneratedFile(path, { status: 'approved' })
    },
    [updateGeneratedFile]
  )

  const handleReject = useCallback(
    (path: string) => {
      // For now, just remove the file from tracking
      // In a full implementation, this would trigger a revision request
      removeGeneratedFile(path)
    },
    [removeGeneratedFile]
  )

  const handleView = useCallback(
    (path: string) => {
      onViewFile?.(path)
    },
    [onViewFile]
  )

  // Filter files based on showAll flag
  const filesToShow = showAll
    ? generatedFiles
    : generatedFiles.filter((f) => f.status === 'draft')

  // Only show in incremental mode or when showAll is true
  if (generationMode !== 'incremental' && !showAll) {
    return null
  }

  if (filesToShow.length === 0) {
    return (
      <div className={styles.fileApproval}>
        <div className={styles.header}>
          <h3 className={styles.title}>Generated Files</h3>
        </div>
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>No files pending approval</span>
        </div>
      </div>
    )
  }

  const pendingCount = generatedFiles.filter((f) => f.status === 'draft').length
  const approvedCount = generatedFiles.filter(
    (f) => f.status === 'approved'
  ).length

  return (
    <div className={styles.fileApproval}>
      <div className={styles.header}>
        <h3 className={styles.title}>Generated Files</h3>
        <div className={styles.stats}>
          {pendingCount > 0 && (
            <span className={styles.statPending}>{pendingCount} pending</span>
          )}
          {approvedCount > 0 && (
            <span className={styles.statApproved}>
              {approvedCount} approved
            </span>
          )}
        </div>
      </div>
      <div className={styles.fileList}>
        {filesToShow.map((file) => (
          <FileApprovalItem
            key={file.path}
            file={file}
            onApprove={handleApprove}
            onReject={handleReject}
            onView={handleView}
          />
        ))}
      </div>
    </div>
  )
}
