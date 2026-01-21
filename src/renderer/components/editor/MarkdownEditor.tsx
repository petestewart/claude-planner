import type { ReactElement } from 'react'
import { useCallback, useMemo, useEffect, useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { TabBar } from './TabBar'
import { CodeEditor } from './CodeEditor'
import { WysiwygEditor } from './WysiwygEditor'
import { ModeToggle } from './ModeToggle'
import { EditorToolbar, type FormatAction } from './EditorToolbar'
import { ConflictDialog } from './ConflictDialog'
import { useAutoSave } from './hooks/useAutoSave'
import { useFileSync } from './hooks/useFileSync'
import styles from './editor.module.css'

export function MarkdownEditor(): ReactElement {
  const {
    activeFile,
    openFiles,
    mode,
    autoSaveEnabled,
    setActiveFile,
    closeFile,
    updateContent,
    saveActiveFile,
    setMode,
  } = useEditorStore()

  const autoSaveDelay = useSettingsStore((state) => state.autoSaveDelay)

  const files = useMemo(() => {
    return Array.from(openFiles.values()).map((f) => ({
      path: f.path,
      name: f.name,
      isDirty: f.isDirty,
    }))
  }, [openFiles])

  const activeFileContent = useMemo(() => {
    if (!activeFile) return null
    return openFiles.get(activeFile)
  }, [activeFile, openFiles])

  // State for unsaved changes confirmation dialog
  const [pendingClose, setPendingClose] = useState<string | null>(null)

  // Auto-save hook
  useAutoSave(
    activeFile,
    activeFileContent?.content ?? '',
    autoSaveEnabled,
    autoSaveDelay
  )

  // File sync hook (detects external changes)
  useFileSync(activeFile)

  const handleTabClick = useCallback(
    (path: string) => {
      setActiveFile(path)
    },
    [setActiveFile]
  )

  const handleTabClose = useCallback(
    (path: string) => {
      const file = openFiles.get(path)
      if (file?.isDirty) {
        // Show confirmation dialog for unsaved changes
        setPendingClose(path)
        return
      }
      closeFile(path)
    },
    [openFiles, closeFile]
  )

  const handleConfirmClose = useCallback(() => {
    if (pendingClose) {
      closeFile(pendingClose)
      setPendingClose(null)
    }
  }, [pendingClose, closeFile])

  const handleCancelClose = useCallback(() => {
    setPendingClose(null)
  }, [])

  const handleContentChange = useCallback(
    (content: string) => {
      if (activeFile) {
        updateContent(activeFile, content)
      }
    },
    [activeFile, updateContent]
  )

  const handleSave = useCallback(() => {
    void saveActiveFile()
  }, [saveActiveFile])

  const handleModeChange = useCallback(
    (newMode: 'wysiwyg' | 'markdown') => {
      setMode(newMode)
    },
    [setMode]
  )

  const handleFormat = useCallback((_action: FormatAction) => {
    // Format actions are handled by Milkdown's built-in keyboard shortcuts
    // The toolbar serves as a visual reference for available formatting options
    // Users can click buttons or use the keyboard shortcuts shown in tooltips
    // TODO: Integrate with Milkdown's command system for click-to-format
  }, [])

  // Keyboard shortcut: Cmd+Shift+M to toggle mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'm') {
        e.preventDefault()
        setMode(mode === 'wysiwyg' ? 'markdown' : 'wysiwyg')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mode, setMode])

  return (
    <div className={styles.editorContainer}>
      <TabBar
        files={files}
        activePath={activeFile}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
      />
      {activeFileContent && (
        <div className={styles.editorHeader}>
          <ModeToggle mode={mode} onChange={handleModeChange} />
        </div>
      )}
      {activeFileContent && mode === 'wysiwyg' && (
        <EditorToolbar onFormat={handleFormat} />
      )}
      <div className={styles.editorContent}>
        {activeFileContent ? (
          mode === 'wysiwyg' ? (
            <WysiwygEditor
              content={activeFileContent.content}
              onChange={handleContentChange}
              onSave={handleSave}
            />
          ) : (
            <CodeEditor
              content={activeFileContent.content}
              onChange={handleContentChange}
              onSave={handleSave}
            />
          )
        ) : (
          <div className={styles.emptyState}>
            <span>No file open</span>
            <span className={styles.hint}>
              Select a file from the browser to edit
            </span>
          </div>
        )}
      </div>

      {/* Conflict Dialog */}
      <ConflictDialog />

      {/* Unsaved Changes Dialog */}
      {pendingClose && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle}>Unsaved Changes</h3>
            </div>
            <div className={styles.dialogContent}>
              <p>
                This file has unsaved changes. Are you sure you want to close
                it?
              </p>
            </div>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogButtonSecondary}
                onClick={handleCancelClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dialogButtonPrimary}
                onClick={handleConfirmClose}
              >
                Close Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
