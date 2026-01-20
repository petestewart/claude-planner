import type { ReactElement } from 'react'
import styles from './file-browser.module.css'

interface FileIconProps {
  type: 'file' | 'directory'
  extension?: string
  expanded?: boolean
}

const FILE_ICONS: Record<string, string> = {
  md: '📄',
  ts: '📘',
  tsx: '📘',
  js: '📒',
  jsx: '📒',
  json: '📋',
  css: '🎨',
  html: '🌐',
  yml: '⚙️',
  yaml: '⚙️',
  gitignore: '🔒',
  env: '🔐',
  default: '📄',
}

export function FileIcon({
  type,
  extension,
  expanded,
}: FileIconProps): ReactElement {
  if (type === 'directory') {
    return (
      <span className={styles.fileIcon} role="img" aria-label="folder">
        {expanded ? '📂' : '📁'}
      </span>
    )
  }

  const icon = extension ? FILE_ICONS[extension] || FILE_ICONS.default : FILE_ICONS.default

  return (
    <span className={styles.fileIcon} role="img" aria-label="file">
      {icon}
    </span>
  )
}
