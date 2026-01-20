import type { MouseEvent as ReactMouseEvent, ReactElement } from 'react'
import type { FileNode, FileStatus } from '../../../shared/types/file'
import { FileTreeNode } from './FileTreeNode'

interface FileTreeProps {
  root: FileNode
  selectedPath: string | null
  expandedPaths: Set<string>
  fileStatuses: Map<string, FileStatus>
  onSelect: (path: string) => void
  onToggle: (path: string) => void
  onContextMenu: (event: ReactMouseEvent, node: FileNode) => void
  onOpenFile: (path: string) => void
}

export function FileTree({
  root,
  selectedPath,
  expandedPaths,
  fileStatuses,
  onSelect,
  onToggle,
  onContextMenu,
  onOpenFile,
}: FileTreeProps): ReactElement {
  const renderNode = (node: FileNode): ReactElement => {
    const isSelected = node.path === selectedPath
    const isExpanded = expandedPaths.has(node.path)
    const status = fileStatuses.get(node.path) || 'normal'

    return (
      <div key={node.id}>
        <FileTreeNode
          node={node}
          isSelected={isSelected}
          isExpanded={isExpanded}
          status={status}
          onSelect={() => onSelect(node.path)}
          onToggle={() => onToggle(node.path)}
          onContextMenu={(e) => onContextMenu(e, node)}
          onDoubleClick={() => onOpenFile(node.path)}
        />
        {node.type === 'directory' && isExpanded && node.children && (
          <div role="group">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div role="tree" aria-label="File tree">
      {root.children?.map((child) => renderNode(child))}
    </div>
  )
}
