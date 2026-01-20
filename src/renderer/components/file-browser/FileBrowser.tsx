import type { MouseEvent as ReactMouseEvent, ReactElement, KeyboardEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as path from 'path'
import type { FileNode } from '../../../shared/types/file'
import { useFileStore } from '../../stores/fileStore'
import { FileTree } from './FileTree'
import { FileBrowserToolbar } from './FileBrowserToolbar'
import { useFileWatcher } from './hooks/useFileWatcher'
import { ContextMenu, type ContextMenuItem } from '../common'
import styles from './file-browser.module.css'

interface FileBrowserProps {
  onOpenFile?: (path: string) => void
}

interface ContextMenuState {
  x: number
  y: number
  node: FileNode
}

export function FileBrowser({ onOpenFile }: FileBrowserProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    tree,
    rootPath,
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

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

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
    (event: ReactMouseEvent, node: FileNode) => {
      event.preventDefault()
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        node,
      })
    },
    []
  )

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleOpenFile = useCallback(
    (filePath: string) => {
      selectFile(filePath)
      onOpenFile?.(filePath)
    },
    [selectFile, onOpenFile]
  )

  const handleCreateFile = useCallback(
    async (parentPath: string) => {
      const fileName = prompt('Enter file name:')
      if (!fileName) return

      const filePath = path.join(parentPath, fileName)
      try {
        await window.api.file.create(filePath)
        await refreshTree()
        selectFile(filePath)
        onOpenFile?.(filePath)
      } catch (err) {
        console.error('Failed to create file:', err)
      }
    },
    [refreshTree, selectFile, onOpenFile]
  )

  const handleCreateFolder = useCallback(
    async (parentPath: string) => {
      const folderName = prompt('Enter folder name:')
      if (!folderName) return

      const folderPath = path.join(parentPath, folderName)
      try {
        await window.api.dir.create(folderPath)
        await refreshTree()
      } catch (err) {
        console.error('Failed to create folder:', err)
      }
    },
    [refreshTree]
  )

  const handleRename = useCallback(
    async (node: FileNode) => {
      const newName = prompt('Enter new name:', node.name)
      if (!newName || newName === node.name) return

      const parentDir = path.dirname(node.path)
      const newPath = path.join(parentDir, newName)
      try {
        await window.api.file.rename(node.path, newPath)
        await refreshTree()
        if (node.type === 'file') {
          selectFile(newPath)
          onOpenFile?.(newPath)
        }
      } catch (err) {
        console.error('Failed to rename:', err)
      }
    },
    [refreshTree, selectFile, onOpenFile]
  )

  const handleDelete = useCallback(
    async (node: FileNode) => {
      const confirmed = confirm(
        `Are you sure you want to delete "${node.name}"?${node.type === 'directory' ? ' This will delete all contents.' : ''}`
      )
      if (!confirmed) return

      try {
        await window.api.file.delete(node.path)
        await refreshTree()
      } catch (err) {
        console.error('Failed to delete:', err)
      }
    },
    [refreshTree]
  )

  const handleNewFile = useCallback(() => {
    if (!rootPath) return
    const targetDir = selectedPath ? path.dirname(selectedPath) : rootPath
    void handleCreateFile(targetDir)
  }, [rootPath, selectedPath, handleCreateFile])

  const handleNewFolder = useCallback(() => {
    if (!rootPath) return
    const targetDir = selectedPath ? path.dirname(selectedPath) : rootPath
    void handleCreateFolder(targetDir)
  }, [rootPath, selectedPath, handleCreateFolder])

  const getContextMenuItems = useCallback(
    (node: FileNode): ContextMenuItem[] => {
      if (node.type === 'file') {
        return [
          {
            id: 'open',
            label: 'Open',
            icon: '📄',
            handler: () => handleOpenFile(node.path),
          },
          { id: 'sep1', separator: true },
          {
            id: 'rename',
            label: 'Rename',
            icon: '✏️',
            shortcut: 'F2',
            handler: () => void handleRename(node),
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: '🗑️',
            danger: true,
            handler: () => void handleDelete(node),
          },
        ]
      }

      // Directory context menu
      return [
        {
          id: 'newFile',
          label: 'New File',
          icon: '📄',
          handler: () => void handleCreateFile(node.path),
        },
        {
          id: 'newFolder',
          label: 'New Folder',
          icon: '📁',
          handler: () => void handleCreateFolder(node.path),
        },
        { id: 'sep1', separator: true },
        {
          id: 'rename',
          label: 'Rename',
          icon: '✏️',
          shortcut: 'F2',
          handler: () => void handleRename(node),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: '🗑️',
          danger: true,
          handler: () => void handleDelete(node),
        },
      ]
    },
    [handleOpenFile, handleRename, handleDelete, handleCreateFile, handleCreateFolder]
  )

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
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.node)}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
