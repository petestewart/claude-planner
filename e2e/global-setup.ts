/**
 * Global setup for Playwright E2E tests
 *
 * This file runs once before all tests. It ensures the Electron app
 * is built and ready for testing.
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

export default async function globalSetup(): Promise<void> {
  console.log('\n🔧 Setting up E2E tests...')

  // Check if the app has been built
  const mainEntry = path.join(__dirname, '..', 'dist', 'main', 'index.js')

  if (!existsSync(mainEntry)) {
    console.log('📦 Building application...')
    try {
      execSync('npm run build', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      })
    } catch {
      throw new Error('Failed to build the application. Please ensure the build succeeds before running E2E tests.')
    }
  } else {
    console.log('✅ Application already built')
  }

  console.log('✅ E2E setup complete\n')
}
