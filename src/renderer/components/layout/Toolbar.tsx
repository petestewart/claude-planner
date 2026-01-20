import type { ReactElement } from 'react'
import styles from './Toolbar.module.css'

export function Toolbar(): ReactElement {
  const handleNewProject = (): void => {
    // TODO: Implement new project flow
  }

  const handleOpenProject = (): void => {
    // TODO: Implement open project flow
  }

  const handleSettings = (): void => {
    // TODO: Implement settings modal
  }

  return (
    <header className={styles.toolbar}>
      <div className={styles.actions}>
        <button
          className={styles.button}
          onClick={handleNewProject}
          title="Create new project"
        >
          New Project
        </button>
        <button
          className={styles.button}
          onClick={handleOpenProject}
          title="Open existing project"
        >
          Open
        </button>
      </div>
      <div className={styles.title}>
        <span className={styles.projectName}>Spec Planner</span>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.iconButton}
          onClick={handleSettings}
          title="Settings"
          aria-label="Settings"
        >
          ⚙️
        </button>
      </div>
    </header>
  )
}
