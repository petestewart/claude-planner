import type { ReactElement } from 'react'
import { useRef, useEffect } from 'react'
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core'
import { replaceAll } from '@milkdown/utils'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { prism, prismConfig } from '@milkdown/plugin-prism'
import { nord } from '@milkdown/theme-nord'
import styles from './editor.module.css'

// Import Prism core first, then languages
import 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-toml'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-css'

// Import nord theme CSS
import '@milkdown/theme-nord/style.css'

interface WysiwygEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
}

function MilkdownEditor({
  content,
  onChange,
  onSave,
}: WysiwygEditorProps): ReactElement {
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  const lastContentRef = useRef(content)

  // Keep refs updated
  onChangeRef.current = onChange
  onSaveRef.current = onSave

  const { get } = useEditor((root) =>
    Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, lastContentRef.current)
        ctx.set(prismConfig.key, {
          configureRefractor: () => {
            // Languages are already loaded via imports
          },
        })
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          // Only notify parent if content actually changed
          if (markdown !== lastContentRef.current) {
            lastContentRef.current = markdown
            onChangeRef.current(markdown)
          }
        })
      })
      .use(commonmark)
      .use(gfm)
      .use(prism)
      .use(listener)
  )

  // Handle save shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSaveRef.current?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Update editor content when prop changes externally (e.g., file switch)
  useEffect(() => {
    const editor = get()
    if (!editor) return

    // Only update if content changed externally (not from our own onChange)
    if (content !== lastContentRef.current) {
      lastContentRef.current = content
      editor.action(replaceAll(content))
    }
  }, [content, get])

  return (
    <div className={styles.wysiwygEditor}>
      <Milkdown />
    </div>
  )
}

export function WysiwygEditor(props: WysiwygEditorProps): ReactElement {
  return (
    <MilkdownProvider>
      <MilkdownEditor {...props} />
    </MilkdownProvider>
  )
}
