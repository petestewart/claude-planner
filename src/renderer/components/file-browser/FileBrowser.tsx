import type { MouseEvent as ReactMouseEvent, ReactElement, KeyboardEvent } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import type { FileNode } from '../../../shared/types/file'
import { useFileStore } from '../../stores/fileStore'
import { FileTree } from './FileTree'
import { FileBrowserToolbar } from './FileBrowserToolbar'
import { useFileWatcher } from './hooks/useFileWatcher'
import styles from './file-browser.module.css'

interface FileBrowserProps {
  onOpenFile?: (path: string) => void
}

export function FileBrowser({ onOpenFile }: FileBrowserProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    tree,
    selectedPath,
    expandedPaths,
    fileStatuses,
    isLoading,
    error,
    refreshTree,
    selectFile,
    toggleExpanded,
    collapseAll,
  } = useFileStore()

  // Enable file watching for real-time updates
  useFileWatcher()

  const handleSelect = useCallback(
    (path: string) => {
      selectFile(path)
      onOpenFile?.(path)
    },
    [selectFile, onOpenFile]
  )

  const handleToggle = useCallback(
    (path: string) => {
      toggleExpanded(path)
    },
    [toggleExpanded]
  )

  const handleContextMenu = useCallback(
    (_event: ReactMouseEvent, _node: FileNode) => {
      // TODO: Implement context menu in Phase 17
    },
    []
  )

  const handleOpenFile = useCallback(
    (path: string) => {
      selectFile(path)
      onOpenFile?.(path)
    },
    [selectFile, onOpenFile]
  )

  const handleNewFile = useCallback(() => {
    // TODO: Implement in Phase 17
  }, [])

  const handleNewFolder = useCallback(() => {
    // TODO: Implement in Phase 17
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!tree) return

      const flattenTree = (node: FileNode): FileNode[] => {
        const result: FileNode[] = []
        const traverse = (n: FileNode): void => {
          result.push(n)
          if (n.type === 'directory' && expandedPaths.has(n.path) && n.children) {
            n.children.forEach(traverse)
          }
        }
        if (node.children) {
          node.children.forEach(traverse)
        }
        return result
      }

      const flatNodes = flattenTree(tree)
      const currentIndex = flatNodes.findIndex((n) => n.path === selectedPath)

      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault()
          if (currentIndex > 0) {
            const prevNode = flatNodes[currentIndex - 1]
            if (prevNode) {
              selectFile(prevNode.path)
            }
          }
          break
        }
        case 'ArrowDown': {
          event.preventDefault()
          if (currentIndex < flatNodes.length - 1) {
            const nextNode = flatNodes[currentIndex + 1]
            if (nextNode) {
              selectFile(nextNode.path)
            }
          }
          break
        }
        case 'ArrowLeft': {
          event.preventDefault()
          const currentNode = flatNodes[currentIndex]
          if (currentNode) {
            if (currentNode.type === 'directory' && expandedPaths.has(currentNode.path)) {
              toggleExpanded(currentNode.path)
            } else {
              // Go to parent
              const parentPath = currentNode.path.substring(0, currentNode.path.lastIndexOf('/'))
              const parentNode = flatNodes.find((n) => n.path === parentPath)
              if (parentNode) {
                selectFile(parentNode.path)
              }
            }
          }
          break
        }
        case 'ArrowRight': {
          event.preventDefault()
          const currentNode = flatNodes[currentIndex]
          if (currentNode?.type === 'directory') {
            if (!expandedPaths.has(currentNode.path)) {
              toggleExpanded(currentNode.path)
            } else if (currentNode.children && currentNode.children.length > 0) {
              const firstChild = currentNode.children[0]
              if (firstChild) {
                selectFile(firstChild.path)
              }
            }
          }
          break
        }
        case 'Enter': {
          event.preventDefault()
          const currentNode = flatNodes[currentIndex]
          if (currentNode?.type === 'file') {
            onOpenFile?.(currentNode.path)
          } else if (currentNode?.type === 'directory') {
            toggleExpanded(currentNode.path)
          }
          break
        }
        case ' ': {
          event.preventDefault()
          const currentNode = flatNodes[currentIndex]
          if (currentNode?.type === 'directory') {
            toggleExpanded(currentNode.path)
          }
          break
        }
      }
    },
    [tree, selectedPath, expandedPaths, selectFile, toggleExpanded, onOpenFile]
  )

  // Focus the container when a file is selected
  useEffect(() => {
    if (selectedPath && containerRef.current) {
      containerRef.current.focus()
    }
  }, [selectedPath])

  return (
    <div
      ref={containerRef}
      className={styles.fileBrowser}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <FileBrowserToolbar
        onRefresh={refreshTree}
        onCollapseAll={collapseAll}
        onNewFile={handleNewFile}
        onNewFolder={handleNewFolder}
        isLoading={isLoading}
      />
      <div className={styles.fileTree}>
        {error && (
          <div className={styles.error}>
            <span>Error: {error}</span>
            <button onClick={refreshTree}>Retry</button>
          </div>
        )}
        {!tree && !error && !isLoading && (
          <div className={styles.emptyState}>
            <span>No project open</span>
            <span className={styles.hint}>Open a project to see files</span>
          </div>
        )}
        {isLoading && !tree && (
          <div className={styles.loading}>Loading...</div>
        )}
        {tree && (
          <FileTree
            root={tree}
            selectedPath={selectedPath}
            expandedPaths={expandedPaths}
            fileStatuses={fileStatuses}
            onSelect={handleSelect}
            onToggle={handleToggle}
            onContextMenu={handleContextMenu}
            onOpenFile={handleOpenFile}
          />
        )}
      </div>
    </div>
  )
}
