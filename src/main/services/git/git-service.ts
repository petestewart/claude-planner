/**
 * Git Service Implementation
 *
 * Main service for git operations. Has NO Electron dependencies
 * and can be extracted as a standalone module.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import type {
  GitService,
  GitServiceOptions,
  GitStatus,
  FileStatus,
  CommitInfo,
  DiffOptions,
  FileDiff,
} from './types'
import { GitExecutor } from './git-executor'
import { DiffParser } from './diff-parser'

/**
 * Factory function for creating git service
 */
export function createGitService(options: GitServiceOptions): GitService {
  return new GitServiceImpl(options)
}

class GitServiceImpl implements GitService {
  private executor: GitExecutor
  private diffParser: DiffParser
  private autoCommitEnabled: boolean
  private autoCommitTimer: ReturnType<typeof setTimeout> | null = null
  private pendingChanges: Set<string> = new Set()

  constructor(private options: GitServiceOptions) {
    this.executor = new GitExecutor(
      options.gitPath ?? 'git',
      options.cwd,
      options.debug ?? false
    )
    this.diffParser = new DiffParser()
    this.autoCommitEnabled = options.autoCommit ?? false
  }

  async init(): Promise<void> {
    await this.executor.run(['init'])

    // Create .gitignore with sensible defaults
    const gitignorePath = path.join(this.options.cwd, '.gitignore')

    // Check if .gitignore already exists
    try {
      await fs.access(gitignorePath)
      // File exists, don't overwrite
    } catch {
      // File doesn't exist, create it
      const gitignore = `# Dependencies
node_modules/

# Build output
dist/
build/

# Environment
.env
.env.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db
`
      await fs.writeFile(gitignorePath, gitignore)
    }
  }

  async isRepo(): Promise<boolean> {
    const result = await this.executor.runSilent(['rev-parse', '--is-inside-work-tree'])
    return result !== null && result.trim() === 'true'
  }

  async getStatus(): Promise<GitStatus> {
    const isRepo = await this.isRepo()
    if (!isRepo) {
      return {
        isRepo: false,
        branch: null,
        staged: [],
        modified: [],
        untracked: [],
        isDirty: false,
      }
    }

    // Get branch name
    const branch = await this.getCurrentBranch()

    // Get status using porcelain v2 format
    const statusOutput = await this.executor.run([
      'status',
      '--porcelain=v2',
      '--branch',
    ])

    const { staged, modified, untracked } = this.parseStatusOutput(statusOutput)

    return {
      isRepo: true,
      branch,
      staged,
      modified,
      untracked,
      isDirty: staged.length > 0 || modified.length > 0 || untracked.length > 0,
    }
  }

  async stage(files: string[]): Promise<void> {
    if (files.length === 0) return
    await this.executor.run(['add', '--', ...files])
  }

  async stageAll(): Promise<void> {
    await this.executor.run(['add', '-A'])
  }

  async unstage(files: string[]): Promise<void> {
    if (files.length === 0) return
    await this.executor.run(['reset', 'HEAD', '--', ...files])
  }

  async commit(message: string): Promise<CommitInfo> {
    await this.executor.run(['commit', '-m', message])

    // Get info about the commit we just made
    const log = await this.log(1)
    if (!log[0]) {
      throw new Error('Failed to retrieve commit info after commit')
    }
    return log[0]
  }

  async diff(options?: DiffOptions): Promise<FileDiff[]> {
    const args = ['diff']

    if (options?.staged) {
      args.push('--cached')
    }

    if (options?.commit) {
      args.push(options.commit)
    }

    if (options?.contextLines !== undefined) {
      args.push(`-U${options.contextLines}`)
    }

    if (options?.files?.length) {
      args.push('--', ...options.files)
    }

    const output = await this.executor.run(args)
    return this.diffParser.parse(output)
  }

  async log(limit = 10): Promise<CommitInfo[]> {
    // Check if there are any commits
    const hasCommits = await this.executor.runSilent(['rev-parse', 'HEAD'])
    if (!hasCommits) {
      return []
    }

    const format = '%H%x00%h%x00%s%x00%an%x00%ae%x00%aI'
    const output = await this.executor.run([
      'log',
      `--format=${format}`,
      `-n${limit}`,
    ])

    return this.parseLogOutput(output)
  }

  setAutoCommit(enabled: boolean): void {
    this.autoCommitEnabled = enabled

    if (!enabled && this.autoCommitTimer) {
      clearTimeout(this.autoCommitTimer)
      this.autoCommitTimer = null
      this.pendingChanges.clear()
    }
  }

  triggerAutoCommit(): void {
    if (!this.autoCommitEnabled) return

    // Debounce auto-commit
    if (this.autoCommitTimer) {
      clearTimeout(this.autoCommitTimer)
    }

    this.autoCommitTimer = setTimeout(async () => {
      await this.performAutoCommit()
    }, this.options.autoCommitDelay ?? 5000)
  }

  dispose(): void {
    if (this.autoCommitTimer) {
      clearTimeout(this.autoCommitTimer)
      this.autoCommitTimer = null
    }
  }

  /**
   * Update the working directory
   */
  setCwd(cwd: string): void {
    this.options.cwd = cwd
    this.executor.setCwd(cwd)
  }

  // Private methods

  private async getCurrentBranch(): Promise<string | null> {
    const result = await this.executor.runSilent(['rev-parse', '--abbrev-ref', 'HEAD'])
    if (!result) return null
    return result.trim() || null
  }

  private parseStatusOutput(output: string): {
    staged: FileStatus[]
    modified: FileStatus[]
    untracked: string[]
  } {
    const staged: FileStatus[] = []
    const modified: FileStatus[] = []
    const untracked: string[] = []

    const lines = output.split('\n')

    for (const line of lines) {
      if (!line) continue

      // Skip branch header lines
      if (line.startsWith('#')) continue

      // Porcelain v2 format:
      // 1 = ordinary changed entry
      // 2 = renamed/copied entry
      // u = unmerged entry
      // ? = untracked entry

      if (line.startsWith('1 ')) {
        // Ordinary change: 1 XY sub mH mI mW hH hI path
        const parts = line.split(' ')
        const xy = parts[1] // XY status codes
        if (!xy || xy.length < 2) continue

        const filePath = parts.slice(8).join(' ')
        const stagedStatus = xy[0]
        const unstagedStatus = xy[1]

        if (stagedStatus && stagedStatus !== '.') {
          staged.push({
            path: filePath,
            status: this.mapStatusCode(stagedStatus),
          })
        }

        if (unstagedStatus && unstagedStatus !== '.') {
          modified.push({
            path: filePath,
            status: this.mapStatusCode(unstagedStatus),
          })
        }
      } else if (line.startsWith('2 ')) {
        // Rename/copy: 2 XY sub mH mI mW hH hI X score path\torigPath
        const parts = line.split('\t')
        const firstPart = parts[0]
        if (!firstPart) continue

        const info = firstPart.split(' ')
        const xy = info[1]
        if (!xy) continue

        const newPath = firstPart.split(' ').slice(9).join(' ')
        const oldPath = parts[1]

        const stagedStatus = xy[0]

        if (stagedStatus === 'R' && oldPath) {
          staged.push({
            path: newPath,
            status: 'renamed',
            oldPath,
          })
        } else if (stagedStatus === 'C' && oldPath) {
          staged.push({
            path: newPath,
            status: 'copied',
            oldPath,
          })
        }
      } else if (line.startsWith('? ')) {
        // Untracked: ? path
        const filePath = line.slice(2)
        untracked.push(filePath)
      }
    }

    return { staged, modified, untracked }
  }

  private mapStatusCode(code: string): FileStatus['status'] {
    switch (code) {
      case 'A':
        return 'added'
      case 'M':
        return 'modified'
      case 'D':
        return 'deleted'
      case 'R':
        return 'renamed'
      case 'C':
        return 'copied'
      default:
        return 'modified'
    }
  }

  private parseLogOutput(output: string): CommitInfo[] {
    if (!output.trim()) return []

    const commits: CommitInfo[] = []
    const entries = output.trim().split('\n')

    for (const entry of entries) {
      const parts = entry.split('\x00')
      if (
        parts.length >= 6 &&
        parts[0] &&
        parts[1] &&
        parts[2] &&
        parts[3] &&
        parts[4] &&
        parts[5]
      ) {
        commits.push({
          hash: parts[0],
          shortHash: parts[1],
          message: parts[2],
          authorName: parts[3],
          authorEmail: parts[4],
          timestamp: parts[5],
        })
      }
    }

    return commits
  }

  private async performAutoCommit(): Promise<void> {
    try {
      const status = await this.getStatus()
      if (!status.isDirty) return

      await this.stageAll()

      const message = this.generateCommitMessage(status)
      await this.commit(message)

      this.pendingChanges.clear()
    } catch (error) {
      console.error('Auto-commit failed:', error)
    }
  }

  private generateCommitMessage(status: GitStatus): string {
    const template = this.options.commitMessageTemplate ?? 'Update specs'

    const changes: string[] = []
    const files = [...status.staged, ...status.modified]

    if (files.length > 0) {
      if (files.length <= 3) {
        changes.push(files.map((f) => f.path).join(', '))
      } else {
        changes.push(`${files.length} files`)
      }
    }

    if (status.untracked.length > 0) {
      if (status.untracked.length <= 3) {
        changes.push(`new: ${status.untracked.join(', ')}`)
      } else {
        changes.push(`${status.untracked.length} new files`)
      }
    }

    if (changes.length > 0) {
      return `${template}: ${changes.join(', ')}`
    }

    return template
  }
}
