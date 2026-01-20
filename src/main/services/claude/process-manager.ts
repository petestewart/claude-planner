/**
 * ProcessManager - Manages Claude CLI subprocess lifecycle
 */

import { spawn, ChildProcess } from 'node:child_process'
import { ClaudeServiceError } from './types'

export interface SpawnOptions {
  cwd: string
  signal: AbortSignal
  timeout?: number
}

/**
 * Manages Claude CLI subprocess lifecycle
 */
export class ProcessManager {
  private currentProcess: ChildProcess | null = null

  constructor(private cliPath: string) {}

  /**
   * Spawn CLI process and return async iterator of stdout chunks
   */
  async *spawn(
    args: string[],
    options: SpawnOptions
  ): AsyncGenerator<string, void, undefined> {
    const process = spawn(this.cliPath, args, {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.currentProcess = process

    // Handle abort signal
    const abortHandler = (): void => {
      this.kill()
    }
    options.signal.addEventListener('abort', abortHandler)

    // Set up timeout if specified
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    if (options.timeout) {
      timeoutId = setTimeout(() => {
        this.kill()
      }, options.timeout)
    }

    try {
      // Yield stdout chunks as they arrive
      if (process.stdout) {
        for await (const chunk of process.stdout) {
          yield chunk.toString()
        }
      }

      // Wait for process to close
      const exitCode = await new Promise<number | null>((resolve, reject) => {
        process.on('close', (code) => resolve(code))
        process.on('error', (err) => reject(err))
      })

      // Check exit code
      if (exitCode !== 0 && exitCode !== null) {
        const stderr = await this.collectStderr(process)
        throw new ClaudeServiceError(
          `CLI exited with code ${exitCode}: ${stderr}`,
          'CLI_ERROR'
        )
      }
    } catch (error) {
      if (options.signal.aborted) {
        throw new ClaudeServiceError('Request cancelled', 'CANCELLED')
      }
      if (error instanceof ClaudeServiceError) {
        throw error
      }
      throw new ClaudeServiceError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN'
      )
    } finally {
      options.signal.removeEventListener('abort', abortHandler)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      this.currentProcess = null
    }
  }

  /**
   * Kill the current process if running
   */
  kill(): void {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM')
    }
  }

  /**
   * Check if CLI is available by running --version
   */
  async checkAvailability(): Promise<{ available: boolean; version?: string }> {
    return new Promise((resolve) => {
      const process = spawn(this.cliPath, ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let output = ''
      process.stdout?.on('data', (chunk) => {
        output += chunk.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          // Try to parse version from output
          const versionMatch = output.match(/(\d+\.\d+\.\d+)/)
          const version = versionMatch?.[1]
          resolve(version
            ? { available: true, version }
            : { available: true }
          )
        } else {
          resolve({ available: false })
        }
      })

      process.on('error', () => {
        resolve({ available: false })
      })
    })
  }

  private async collectStderr(process: ChildProcess): Promise<string> {
    const chunks: string[] = []
    if (process.stderr) {
      for await (const chunk of process.stderr) {
        chunks.push(chunk.toString())
      }
    }
    return chunks.join('')
  }
}
