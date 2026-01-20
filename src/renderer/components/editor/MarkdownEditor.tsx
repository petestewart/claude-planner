import type { ReactElement } from 'react'
import { useCallback, useMemo } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { TabBar } from './TabBar'
import { CodeEditor } from './CodeEditor'
import styles from './editor.module.css'

export function MarkdownEditor(): ReactElement {
  const {
    activeFile,
    openFiles,
    setActiveFile,
    closeFile,
    updateContent,
    saveActiveFile,
  } = useEditorStore()

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
        // TODO: Show confirmation dialog
        const confirmed = true // For now, always allow close
        if (!confirmed) return
      }
      closeFile(path)
    },
    [openFiles, closeFile]
  )

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

  return (
    <div className={styles.editorContainer}>
      <TabBar
        files={files}
        activePath={activeFile}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
      />
      <div className={styles.editorContent}>
        {activeFileContent ? (
          <CodeEditor
            content={activeFileContent.content}
            onChange={handleContentChange}
            onSave={handleSave}
          />
        ) : (
          <div className={styles.emptyState}>
            <span>No file open</span>
            <span className={styles.hint}>
              Select a file from the browser to edit
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
