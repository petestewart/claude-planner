import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactElement } from 'react'
import type { FileNode, FileStatus } from '../../../shared/types/file'
import { FileIcon } from './FileIcon'
import styles from './file-browser.module.css'

interface FileTreeNodeProps {
  node: FileNode
  isSelected: boolean
  isExpanded: boolean
  status: FileStatus
  onSelect: () => void
  onToggle: () => void
  onContextMenu: (event: ReactMouseEvent) => void
  onDoubleClick: () => void
}

export function FileTreeNode({
  node,
  isSelected,
  isExpanded,
  status,
  onSelect,
  onToggle,
  onContextMenu,
  onDoubleClick,
}: FileTreeNodeProps): ReactElement {
  const handleClick = (): void => {
    if (node.type === 'directory') {
      onToggle()
    } else {
      onSelect()
    }
  }

  const handleDoubleClick = (): void => {
    if (node.type === 'file') {
      onDoubleClick()
    }
  }

  const statusClass = status !== 'normal' ? styles[`fileNode--${status}`] : ''

  return (
    <div
      className={`${styles.fileNode} ${isSelected ? styles['fileNode--selected'] : ''} ${statusClass}`}
      style={{ '--depth': node.depth } as CSSProperties}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={node.type === 'directory' ? isExpanded : undefined}
      tabIndex={isSelected ? 0 : -1}
      data-path={node.path}
    >
      {node.type === 'directory' && (
        <span
          className={`${styles.fileNodeChevron} ${isExpanded ? styles['fileNodeChevron--expanded'] : ''}`}
        >
          ›
        </span>
      )}
      <FileIcon
        type={node.type}
        {...(node.extension ? { extension: node.extension } : {})}
        expanded={isExpanded}
      />
      <span className={styles.fileNodeName}>{node.name}</span>
    </div>
  )
}
