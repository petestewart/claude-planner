/**
 * Editor state for the markdown editor
 */
export interface EditorState {
  /** Currently open file path (null if none) */
  currentFile: string | null

  /** File content */
  content: string

  /** Whether content has unsaved changes */
  isDirty: boolean

  /** Current editing mode */
  mode: 'wysiwyg' | 'markdown'

  /** Cursor position */
  cursorPosition: CursorPosition
}

export interface CursorPosition {
  line: number
  column: number
}
