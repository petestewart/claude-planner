/**
 * Git Executor
 *
 * Executes git commands via spawned processes.
 */

import { spawn } from 'child_process'
import { GitExecutionError } from './types'

/**
 * Executes git commands
 */
export class GitExecutor {
  constructor(
    private gitPath: string,
    private cwd: string,
    private debug: boolean = false
  ) {}

  /**
   * Run a git command and return stdout
   */
  async run(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.debug) {
        console.warn(`[GitExecutor] Running: git ${args.join(' ')}`)
      }

      const process = spawn(this.gitPath, args, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      process.on('close', (code) => {
        if (this.debug) {
          console.warn(`[GitExecutor] Exit code: ${code}`)
          if (stdout) console.warn(`[GitExecutor] stdout: ${stdout}`)
          if (stderr) console.warn(`[GitExecutor] stderr: ${stderr}`)
        }

        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new GitExecutionError(args, code, stderr))
        }
      })

      process.on('error', (error) => {
        reject(new GitExecutionError(args, -1, error.message))
      })
    })
  }

  /**
   * Run a git command silently (ignore errors)
   * Useful for checking things like "is this a repo"
   */
  async runSilent(args: string[]): Promise<string | null> {
    try {
      return await this.run(args)
    } catch {
      return null
    }
  }

  /**
   * Update the working directory
   */
  setCwd(cwd: string): void {
    this.cwd = cwd
  }

  /**
   * Get the current working directory
   */
  getCwd(): string {
    return this.cwd
  }
}
