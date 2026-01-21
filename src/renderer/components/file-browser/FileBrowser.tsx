import type {
  MouseEvent as ReactMouseEvent,
  ReactElement,
  KeyboardEvent,
} from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FileNode } from '../../../shared/types/file'

// Browser-compatible path helpers (no Node.js dependency)
const pathJoin = (base: string, name: string): string => {
  return base.endsWith('/') ? `${base}${name}` : `${base}/${name}`
}

const pathDirname = (filePath: string): string => {
  const lastSlash = filePath.lastIndexOf('/')
  return lastSlash > 0 ? filePath.substring(0, lastSlash) : filePath
}
import { useFileStore } from '../../stores/fileStore'
import { FileTree } from './FileTree'
import { FileBrowserToolbar } from './FileBrowserToolbar'
import { useFileWatcher } from './hooks/useFileWatcher'
import { ContextMenu, type ContextMenuItem, InputDialog } from '../common'
import styles from './file-browser.module.css'

interface FileBrowserProps {
  onOpenFile?: (path: string) => void
}

interface ContextMenuState {
  x: number
  y: number
  node: FileNode
}

type InputDialogMode = 'newFile' | 'newFolder' | 'rename' | null

interface InputDialogState {
  mode: InputDialogMode
  parentPath: string
  nodeToRename: FileNode | null
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
  const [inputDialog, setInputDialog] = useState<InputDialogState>({
    mode: null,
    parentPath: '',
    nodeToRename: null,
  })

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

  // Open dialog for creating a new file
  const openNewFileDialog = useCallback((parentPath: string) => {
    setInputDialog({
      mode: 'newFile',
      parentPath,
      nodeToRename: null,
    })
  }, [])

  // Open dialog for creating a new folder
  const openNewFolderDialog = useCallback((parentPath: string) => {
    setInputDialog({
      mode: 'newFolder',
      parentPath,
      nodeToRename: null,
    })
  }, [])

  // Open dialog for renaming a file or folder
  const openRenameDialog = useCallback((node: FileNode) => {
    setInputDialog({
      mode: 'rename',
      parentPath: pathDirname(node.path),
      nodeToRename: node,
    })
  }, [])

  // Close the input dialog
  const closeInputDialog = useCallback(() => {
    setInputDialog({
      mode: null,
      parentPath: '',
      nodeToRename: null,
    })
  }, [])

  // Handle dialog submission
  const handleInputDialogSubmit = useCallback(
    async (value: string) => {
      const { mode, parentPath, nodeToRename } = inputDialog

      try {
        if (mode === 'newFile') {
          const filePath = pathJoin(parentPath, value)
          await window.api.file.create(filePath)
          await refreshTree()
          selectFile(filePath)
          onOpenFile?.(filePath)
        } else if (mode === 'newFolder') {
          const folderPath = pathJoin(parentPath, value)
          await window.api.dir.create(folderPath)
          await refreshTree()
        } else if (mode === 'rename' && nodeToRename) {
          if (value !== nodeToRename.name) {
            const newPath = pathJoin(parentPath, value)
            await window.api.file.rename(nodeToRename.path, newPath)
            await refreshTree()
            if (nodeToRename.type === 'file') {
              selectFile(newPath)
              onOpenFile?.(newPath)
            }
          }
        }
      } catch (err) {
        console.error(`Failed to ${mode}:`, err)
      }

      closeInputDialog()
    },
    [inputDialog, refreshTree, selectFile, onOpenFile, closeInputDialog]
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
    const targetDir = selectedPath ? pathDirname(selectedPath) : rootPath
    openNewFileDialog(targetDir)
  }, [rootPath, selectedPath, openNewFileDialog])

  const handleNewFolder = useCallback(() => {
    if (!rootPath) return
    const targetDir = selectedPath ? pathDirname(selectedPath) : rootPath
    openNewFolderDialog(targetDir)
  }, [rootPath, selectedPath, openNewFolderDialog])

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
            handler: () => openRenameDialog(node),
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
          handler: () => openNewFileDialog(node.path),
        },
        {
          id: 'newFolder',
          label: 'New Folder',
          icon: '📁',
          handler: () => openNewFolderDialog(node.path),
        },
        { id: 'sep1', separator: true },
        {
          id: 'rename',
          label: 'Rename',
          icon: '✏️',
          shortcut: 'F2',
          handler: () => openRenameDialog(node),
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
    [
      handleOpenFile,
      openRenameDialog,
      handleDelete,
      openNewFileDialog,
      openNewFolderDialog,
    ]
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!tree) return

      const flattenTree = (node: FileNode): FileNode[] => {
        const result: FileNode[] = []
        const traverse = (n: FileNode): void => {
          result.push(n)
          if (
            n.type === 'directory' &&
            expandedPaths.has(n.path) &&
            n.children
          ) {
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
            if (
              currentNode.type === 'directory' &&
              expandedPaths.has(currentNode.path)
            ) {
              toggleExpanded(currentNode.path)
            } else {
              // Go to parent
              const parentPath = currentNode.path.substring(
                0,
                currentNode.path.lastIndexOf('/')
              )
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
            } else if (
              currentNode.children &&
              currentNode.children.length > 0
            ) {
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
        {isLoading && !tree && <div className={styles.loading}>Loading...</div>}
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
      <InputDialog
        isOpen={inputDialog.mode === 'newFile'}
        title="New File"
        label="Enter file name:"
        placeholder="filename.txt"
        onSubmit={handleInputDialogSubmit}
        onCancel={closeInputDialog}
      />
      <InputDialog
        isOpen={inputDialog.mode === 'newFolder'}
        title="New Folder"
        label="Enter folder name:"
        placeholder="folder-name"
        onSubmit={handleInputDialogSubmit}
        onCancel={closeInputDialog}
      />
      <InputDialog
        isOpen={inputDialog.mode === 'rename'}
        title="Rename"
        label="Enter new name:"
        defaultValue={inputDialog.nodeToRename?.name ?? ''}
        submitLabel="Rename"
        onSubmit={handleInputDialogSubmit}
        onCancel={closeInputDialog}
      />
    </div>
  )
}
