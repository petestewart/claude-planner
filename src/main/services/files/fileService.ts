import * as fs from 'fs/promises'
import * as path from 'path'
import type { FileNode } from '../../../shared/types/file'

/**
 * Patterns to exclude from file tree
 */
const EXCLUDED_PATTERNS = [
  'node_modules',
  '.git',
  '.DS_Store',
  'Thumbs.db',
  '.env',
  '.env.local',
  'dist',
  'build',
  '.next',
  'coverage',
]

function shouldExclude(name: string): boolean {
  return EXCLUDED_PATTERNS.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$')
      return regex.test(name)
    }
    return name === pattern || name.startsWith(pattern)
  })
}

function getExtension(filename: string): string | undefined {
  const ext = path.extname(filename)
  return ext ? ext.slice(1).toLowerCase() : undefined
}

async function buildFileTree(
  dirPath: string,
  depth: number = 0
): Promise<FileNode> {
  const stats = await fs.stat(dirPath)
  const name = path.basename(dirPath)

  const node: FileNode = {
    id: dirPath,
    name,
    path: dirPath,
    type: stats.isDirectory() ? 'directory' : 'file',
    depth,
  }

  if (!stats.isDirectory()) {
    const ext = getExtension(name)
    if (ext) {
      node.extension = ext
    }
    return node
  }

  // Read directory contents
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  // Filter and sort entries (directories first, then files, alphabetically)
  const filtered = entries.filter((entry) => !shouldExclude(entry.name))
  const sorted = filtered.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1
    if (!a.isDirectory() && b.isDirectory()) return 1
    return a.name.localeCompare(b.name)
  })

  // Recursively build children
  const children: FileNode[] = []
  for (const entry of sorted) {
    const childPath = path.join(dirPath, entry.name)
    const childNode = await buildFileTree(childPath, depth + 1)
    children.push(childNode)
  }

  node.children = children
  return node
}

export async function listDirectory(dirPath: string): Promise<FileNode> {
  return buildFileTree(dirPath)
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8')
}

export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8')
}

export async function createFile(
  filePath: string,
  content: string = ''
): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8')
}

export async function createDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}
