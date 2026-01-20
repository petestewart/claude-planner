import type { ReactElement } from 'react'
import styles from './editor.module.css'

type EditorMode = 'wysiwyg' | 'markdown'

interface ModeToggleProps {
  mode: EditorMode
  onChange: (mode: EditorMode) => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps): ReactElement {
  return (
    <div className={styles.modeToggle}>
      <button
        type="button"
        className={`${styles.modeToggleButton} ${mode === 'wysiwyg' ? styles['modeToggleButton--active'] : ''}`}
        onClick={() => onChange('wysiwyg')}
        title="WYSIWYG mode"
      >
        WYSIWYG
      </button>
      <button
        type="button"
        className={`${styles.modeToggleButton} ${mode === 'markdown' ? styles['modeToggleButton--active'] : ''}`}
        onClick={() => onChange('markdown')}
        title="Markdown mode"
      >
        Markdown
      </button>
    </div>
  )
}
