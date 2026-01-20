import type { ReactElement } from 'react'
import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { bracketMatching } from '@codemirror/language'
import styles from './editor.module.css'

interface CodeEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
}

const darkTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-family-mono)',
    padding: '16px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-bg-secondary)',
    color: 'var(--color-text-secondary)',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--color-bg-tertiary)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(0, 122, 204, 0.3)',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(0, 122, 204, 0.5)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-text)',
  },
  '.cm-line': {
    padding: '0 16px',
  },
})

export function CodeEditor({
  content,
  onChange,
  onSave,
}: CodeEditorProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const contentRef = useRef(content)

  // Store callbacks in refs to avoid stale closures
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  contentRef.current = content
  onChangeRef.current = onChange
  onSaveRef.current = onSave

  useEffect(() => {
    if (!containerRef.current) return

    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current?.()
          return true
        },
      },
    ])

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString()
        onChangeRef.current(newContent)
      }
    })

    const state = EditorState.create({
      doc: contentRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        highlightSelectionMatches(),
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        saveKeymap,
        updateListener,
        darkTheme,
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  // Update editor content when prop changes (e.g., file switch)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentContent = view.state.doc.toString()
    if (currentContent !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      })
    }
  }, [content])

  return <div ref={containerRef} className={styles.codeEditor} />
}
