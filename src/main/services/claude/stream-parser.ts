/**
 * StreamParser - Parses Claude CLI stream-json output into structured events
 */

import type { StreamEvent } from './types'

interface JsonEvent {
  type: string
  text?: string
  tool?: string
  input?: unknown
  [key: string]: unknown
}

/**
 * Parses Claude CLI stream-json output into structured events
 */
export class StreamParser {
  private buffer = ''
  private currentFile: {
    path: string
    action: 'create' | 'modify' | 'delete'
    content: string[]
  } | null = null

  /**
   * Parse a chunk of CLI output and return events
   */
  parse(chunk: string): StreamEvent[] {
    this.buffer += chunk
    const events: StreamEvent[] = []

    // Process complete lines
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() ?? '' // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const event = this.parseLine(line)
        if (event) {
          events.push(event)
        }
      } catch {
        // Log parse error but continue - ignore malformed lines
        console.warn('Failed to parse stream line:', line)
      }
    }

    return events
  }

  /**
   * Flush any remaining content in the buffer
   */
  flush(): StreamEvent[] {
    const events: StreamEvent[] = []

    // Try to parse any remaining buffer content
    if (this.buffer.trim()) {
      try {
        const event = this.parseLine(this.buffer)
        if (event) {
          events.push(event)
        }
      } catch {
        // Ignore parse errors on flush
      }
      this.buffer = ''
    }

    // Close any open file
    if (this.currentFile) {
      events.push({ type: 'file_end', path: this.currentFile.path })
      this.currentFile = null
    }

    return events
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.buffer = ''
    this.currentFile = null
  }

  private parseLine(line: string): StreamEvent | null {
    // CLI stream-json format - each line is a JSON object
    const json = JSON.parse(line) as JsonEvent

    switch (json.type) {
      case 'assistant': {
        // Assistant message with content array
        // Format: {"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}
        const message = json.message as { content?: Array<{ type: string; text?: string }> } | undefined
        if (message?.content) {
          for (const block of message.content) {
            if (block.type === 'text' && block.text) {
              return { type: 'text', content: block.text }
            }
          }
        }
        return null
      }

      case 'assistant_text':
        // Text content from assistant (legacy format)
        if (json.text) {
          return { type: 'text', content: json.text }
        }
        return null

      case 'content_block_delta':
        // Delta content update - check for text delta
        if (json.delta && typeof json.delta === 'object') {
          const delta = json.delta as { type?: string; text?: string }
          if (delta.type === 'text_delta' && delta.text) {
            return { type: 'text', content: delta.text }
          }
        }
        return null

      case 'thinking':
        // Thinking/reasoning content
        if (json.text) {
          return { type: 'thinking', content: json.text }
        }
        return null

      case 'tool_use':
        // Tool use event - handle file operations
        return this.handleToolUse(json)

      case 'tool_result':
        // Tool result - may indicate file operation completed
        return this.handleToolResult(json)

      case 'result':
        // Final result event - skip since content was already streamed via assistant events
        return null

      case 'system':
        // System events (init, hooks) - ignore
        return null

      case 'message_start':
      case 'message_delta':
      case 'message_stop':
        // Message lifecycle events - ignore for now
        return null

      case 'content_block_start':
      case 'content_block_stop':
        // Content block lifecycle events - ignore for now
        return null

      case 'error': {
        // Error event
        const errorCode = json.code as string | undefined
        return errorCode
          ? { type: 'error', message: json.message as string || 'Unknown error', code: errorCode }
          : { type: 'error', message: json.message as string || 'Unknown error' }
      }

      default:
        // Unknown event type - ignore
        return null
    }
  }

  private handleToolUse(json: JsonEvent): StreamEvent | null {
    const { tool, input } = json

    if (!tool || typeof tool !== 'string') {
      return { type: 'tool_use', tool: 'unknown', input }
    }

    // Detect file operations from common Claude Code tools
    if (tool === 'write_file' || tool === 'Write') {
      const fileInput = input as { path?: string; file_path?: string }
      const path = fileInput?.path || fileInput?.file_path
      if (path) {
        this.currentFile = {
          path,
          action: 'create',
          content: [],
        }
        return {
          type: 'file_start',
          path,
          action: 'create',
        }
      }
    }

    if (tool === 'edit_file' || tool === 'Edit') {
      const fileInput = input as { path?: string; file_path?: string }
      const path = fileInput?.path || fileInput?.file_path
      if (path) {
        this.currentFile = {
          path,
          action: 'modify',
          content: [],
        }
        return {
          type: 'file_start',
          path,
          action: 'modify',
        }
      }
    }

    if (tool === 'delete_file' || tool === 'rm') {
      const fileInput = input as { path?: string; file_path?: string }
      const path = fileInput?.path || fileInput?.file_path
      if (path) {
        return {
          type: 'file_start',
          path,
          action: 'delete',
        }
      }
    }

    return { type: 'tool_use', tool, input }
  }

  private handleToolResult(_json: JsonEvent): StreamEvent | null {
    // If we have a current file being written, close it
    if (this.currentFile) {
      const event: StreamEvent = { type: 'file_end', path: this.currentFile.path }
      this.currentFile = null
      return event
    }
    return null
  }
}
