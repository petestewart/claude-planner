/**
 * E2E Tests: Settings
 *
 * Tests for TC-037, TC-038, TC-039 from TEST_PLAN.md:
 * - Settings Modal - Open/Close
 * - Settings - Editor Settings
 * - Settings - Git Settings
 *
 * Each test.describe block uses its own isolated app instance to prevent
 * state leakage between test suites.
 */

import { test, expect } from '@playwright/test'
import {
  launchApp,
  closeApp,
  waitForMainLayout,
  dismissAllModals,
  type AppContext,
} from './electron-app'

/**
 * Helper function to open settings modal and wait for it to be fully rendered
 */
async function openSettingsAndWait(context: AppContext): Promise<void> {
  const { window } = context

  // First ensure no modals are blocking
  await dismissAllModals(window)

  // Click the settings button
  const settingsButton = window.locator('button[aria-label="Settings"]')
  await expect(settingsButton).toBeVisible({ timeout: 5000 })
  await settingsButton.click()

  // Wait for the settings modal to be fully rendered
  const settingsTitle = window.locator('h2:has-text("Settings")')
  await expect(settingsTitle).toBeVisible({ timeout: 5000 })

  // Additional wait for modal content to be fully rendered
  await window.waitForTimeout(300)
}

/**
 * Helper function to close settings modal if open
 * Uses the robust dismissAllModals from electron-app for reliability
 */
async function closeSettingsIfOpen(context: AppContext): Promise<void> {
  const { window } = context
  await dismissAllModals(window)
}

test.describe('Settings Modal - Open/Close (TC-037)', () => {
  let context: AppContext

  test.beforeAll(async () => {
    context = await launchApp()
    await waitForMainLayout(context.window)
  })

  test.afterAll(async () => {
    if (context) {
      await closeApp(context)
    }
  })

  // Close any open modal before each test
  test.beforeEach(async () => {
    await closeSettingsIfOpen(context)
  })

  test('should open settings with button click', async () => {
    const { window } = context

    // Click the settings button
    const settingsButton = window.locator('button[aria-label="Settings"]')
    await expect(settingsButton).toBeVisible({ timeout: 5000 })
    await settingsButton.click()

    // Settings modal should appear - look for "Settings" title
    const settingsTitle = window.locator('h2:has-text("Settings")')
    await expect(settingsTitle).toBeVisible({ timeout: 5000 })
  })

  test('should display EDITOR section', async () => {
    await openSettingsAndWait(context)

    // Look for EDITOR section
    const editorSection = context.window.locator('text=EDITOR')
    await expect(editorSection.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display GIT section', async () => {
    await openSettingsAndWait(context)

    // Look for GIT section
    const gitSection = context.window.locator('text=GIT')
    await expect(gitSection.first()).toBeVisible({ timeout: 5000 })
  })

  test('should close settings with Escape key', async () => {
    const { window } = context

    await openSettingsAndWait(context)

    // Press Escape to close
    await window.keyboard.press('Escape')
    await window.waitForTimeout(300)

    // Settings should be closed
    const settingsTitle = window.locator('h2:has-text("Settings")')
    await expect(settingsTitle).not.toBeVisible({ timeout: 3000 })
  })

  test('should have Close button', async () => {
    await openSettingsAndWait(context)

    // Look for Close button at bottom
    const closeButton = context.window.locator('button:has-text("Close")')
    await expect(closeButton).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Settings - Editor Settings (TC-038)', () => {
  let context: AppContext

  test.beforeAll(async () => {
    context = await launchApp()
    await waitForMainLayout(context.window)
  })

  test.afterAll(async () => {
    if (context) {
      await closeApp(context)
    }
  })

  test.beforeEach(async () => {
    await closeSettingsIfOpen(context)
  })

  test('should have Auto-save setting', async () => {
    await openSettingsAndWait(context)

    // Look for Auto-save text
    const autoSaveText = context.window.locator('text=Auto-save').first()
    await expect(autoSaveText).toBeVisible({ timeout: 5000 })
  })

  test('should have Auto-save delay setting', async () => {
    await openSettingsAndWait(context)

    // Look for Auto-save delay text
    const autoSaveDelayText = context.window.locator('text=Auto-save delay')
    await expect(autoSaveDelayText).toBeVisible({ timeout: 5000 })
  })

  test('should have Default editor mode setting', async () => {
    await openSettingsAndWait(context)

    // Look for Default editor mode text
    const editorModeText = context.window.locator('text=Default editor mode')
    await expect(editorModeText).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Settings - Git Settings (TC-039)', () => {
  let context: AppContext

  test.beforeAll(async () => {
    context = await launchApp()
    await waitForMainLayout(context.window)
  })

  test.afterAll(async () => {
    if (context) {
      await closeApp(context)
    }
  })

  test.beforeEach(async () => {
    await closeSettingsIfOpen(context)
  })

  test('should have Auto-commit setting', async () => {
    await openSettingsAndWait(context)

    // Look for Auto-commit text
    const autoCommitText = context.window.locator('text=Auto-commit')
    await expect(autoCommitText).toBeVisible({ timeout: 5000 })
  })

  test('should have Commit message template setting', async () => {
    await openSettingsAndWait(context)

    // Look for Commit message template text
    const templateText = context.window.locator('text=Commit message template')
    await expect(templateText).toBeVisible({ timeout: 5000 })
  })
})
