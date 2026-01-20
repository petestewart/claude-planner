/**
 * Diff Parser
 *
 * Parses git diff output into structured data.
 */

import type { FileDiff, DiffHunk, DiffLine } from './types'

/**
 * Parses git diff output into structured data
 */
export class DiffParser {
  parse(diffOutput: string): FileDiff[] {
    if (!diffOutput.trim()) {
      return []
    }

    const diffs: FileDiff[] = []
    const fileSections = this.splitByFile(diffOutput)

    for (const section of fileSections) {
      const diff = this.parseFileSection(section)
      if (diff) {
        diffs.push(diff)
      }
    }

    return diffs
  }

  private splitByFile(output: string): string[] {
    const sections: string[] = []
    const lines = output.split('\n')

    let current: string[] = []
    for (const line of lines) {
      if (line.startsWith('diff --git') && current.length > 0) {
        sections.push(current.join('\n'))
        current = []
      }
      current.push(line)
    }

    if (current.length > 0 && current.some((l) => l.startsWith('diff --git'))) {
      sections.push(current.join('\n'))
    }

    return sections
  }

  private parseFileSection(section: string): FileDiff | null {
    const lines = section.split('\n')

    // Parse header
    const diffLine = lines.find((l) => l.startsWith('diff --git'))
    if (!diffLine) return null

    // Match diff headers with various prefixes (a/, b/, i/, w/, c/, etc.)
    const pathMatch = diffLine.match(/diff --git .\/(.+) .\/(.+)/)
    if (!pathMatch || !pathMatch[1] || !pathMatch[2]) return null

    const oldPath = pathMatch[1]
    const newPath = pathMatch[2]
    const path = newPath

    // Determine type
    let type: FileDiff['type'] = 'modified'
    if (lines.some((l) => l.startsWith('new file'))) {
      type = 'added'
    } else if (lines.some((l) => l.startsWith('deleted file'))) {
      type = 'deleted'
    } else if (lines.some((l) => l.startsWith('rename from'))) {
      type = 'renamed'
    }

    // Parse hunks
    const hunks = this.parseHunks(lines)

    const result: FileDiff = {
      path,
      type,
      hunks,
      raw: section,
    }

    // Only add oldPath for renamed files
    if (type === 'renamed') {
      result.oldPath = oldPath
    }

    return result
  }

  private parseHunks(lines: string[]): DiffHunk[] {
    const hunks: DiffHunk[] = []
    let currentHunk: DiffHunk | null = null
    let oldLine = 0
    let newLine = 0

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // New hunk - parse the @@ -start,count +start,count @@ format
        const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/)
        if (match && match[1] && match[3]) {
          currentHunk = {
            oldStart: parseInt(match[1], 10),
            oldLines: match[2] ? parseInt(match[2], 10) : 1,
            newStart: parseInt(match[3], 10),
            newLines: match[4] ? parseInt(match[4], 10) : 1,
            lines: [],
          }
          hunks.push(currentHunk)
          oldLine = currentHunk.oldStart
          newLine = currentHunk.newStart
        }
      } else if (currentHunk) {
        const diffLine = this.parseDiffLine(line, oldLine, newLine)
        if (diffLine) {
          currentHunk.lines.push(diffLine)

          // Update line numbers
          if (diffLine.type === 'add') {
            newLine++
          } else if (diffLine.type === 'delete') {
            oldLine++
          } else if (diffLine.type === 'context') {
            oldLine++
            newLine++
          }
        }
      }
    }

    return hunks
  }

  private parseDiffLine(line: string, oldLine: number, newLine: number): DiffLine | null {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      return {
        type: 'add',
        content: line.slice(1),
        newLineNumber: newLine,
      }
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      return {
        type: 'delete',
        content: line.slice(1),
        oldLineNumber: oldLine,
      }
    } else if (line.startsWith(' ')) {
      return {
        type: 'context',
        content: line.slice(1),
        oldLineNumber: oldLine,
        newLineNumber: newLine,
      }
    }

    return null
  }
}
