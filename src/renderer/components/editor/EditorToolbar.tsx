import type { ReactElement } from 'react'
import styles from './editor.module.css'

export type FormatAction =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'strikethrough' }
  | { type: 'code' }
  | { type: 'link' }
  | { type: 'blockquote' }
  | { type: 'bullet-list' }
  | { type: 'ordered-list' }
  | { type: 'task-list' }
  | { type: 'code-block' }
  | { type: 'horizontal-rule' }

interface EditorToolbarProps {
  onFormat: (action: FormatAction) => void
  disabled?: boolean
}

interface ToolbarButtonProps {
  onClick: () => void
  title: string
  disabled?: boolean
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  title,
  disabled,
  children,
}: ToolbarButtonProps): ReactElement {
  return (
    <button
      type="button"
      className={styles.toolbarButton}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function ToolbarDivider(): ReactElement {
  return <div className={styles.toolbarDivider} />
}

export function EditorToolbar({
  onFormat,
  disabled = false,
}: EditorToolbarProps): ReactElement {
  return (
    <div className={styles.editorToolbar}>
      {/* Headings */}
      <ToolbarButton
        onClick={() => onFormat({ type: 'heading', level: 1 })}
        title="Heading 1 (Cmd+1)"
        disabled={disabled}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormat({ type: 'heading', level: 2 })}
        title="Heading 2 (Cmd+2)"
        disabled={disabled}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormat({ type: 'heading', level: 3 })}
        title="Heading 3 (Cmd+3)"
        disabled={disabled}
      >
        H3
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => onFormat({ type: 'bold' })}
        title="Bold (Cmd+B)"
        disabled={disabled}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormat({ type: 'italic' })}
        title="Italic (Cmd+I)"
        disabled={disabled}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormat({ type: 'strikethrough' })}
        title="Strikethrough (Cmd+Shift+S)"
        disabled={disabled}
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormat({ type: 'code' })}
        title="Inline code (Cmd+E)"
        disabled={disabled}
      >
        <code>&lt;/&gt;</code>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Links */}
      <ToolbarButton
        onClick={() => onFormat({ type: 'link' })}
        title="Link (Cmd+K)"
        disabled={disabled}
      >
        🔗
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block elements */}
      <ToolbarButton
        onClick={() => onFormat({ type: 'blockquote' })}
        title="Blockquote (Cmd+Shift+.)"
        disabled={disabled}
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormat({ type: 'bullet-list' })}
        title="Bullet list (Cmd+Shift+8)"
        disabled={disabled}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormat({ type: 'ordered-list' })}
        title="Numbered list (Cmd+Shift+7)"
        disabled={disabled}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormat({ type: 'task-list' })}
        title="Task list (Cmd+Shift+9)"
        disabled={disabled}
      >
        ☑
      </ToolbarButton>

      <ToolbarDivider />

      {/* Code and divider */}
      <ToolbarButton
        onClick={() => onFormat({ type: 'code-block' })}
        title="Code block (Cmd+Shift+C)"
        disabled={disabled}
      >
        {'{ }'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormat({ type: 'horizontal-rule' })}
        title="Horizontal rule (Cmd+Shift+-)"
        disabled={disabled}
      >
        ─
      </ToolbarButton>
    </div>
  )
}
