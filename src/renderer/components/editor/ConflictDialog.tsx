import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { useEditorStore, type ConflictResolution } from '../../stores/editorStore'
import styles from './editor.module.css'

export function ConflictDialog(): ReactElement | null {
  const conflict = useEditorStore((state) => state.conflict)
  const resolveConflict = useEditorStore((state) => state.resolveConflict)

  const handleResolve = useCallback(
    (resolution: ConflictResolution) => {
      resolveConflict(resolution)
    },
    [resolveConflict]
  )

  if (!conflict) return null

  const fileName = conflict.path.split('/').pop() || conflict.path

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <h3 className={styles.dialogTitle}>File Changed Externally</h3>
        </div>
        <div className={styles.dialogContent}>
          <p>
            The file <strong>{fileName}</strong> has been modified outside the
            editor while you have unsaved changes.
          </p>
          <p>How would you like to resolve this conflict?</p>
        </div>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogButtonSecondary}
            onClick={() => handleResolve('load-disk')}
          >
            Load from Disk
          </button>
          <button
            type="button"
            className={styles.dialogButtonPrimary}
            onClick={() => handleResolve('keep-editor')}
          >
            Keep My Changes
          </button>
        </div>
      </div>
    </div>
  )
}
