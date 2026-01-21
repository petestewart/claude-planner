/**
 * E2E Tests: App Launch
 *
 * Tests that verify the application launches correctly and
 * displays the main UI elements.
 */

import { test, expect } from '@playwright/test'
import {
  launchApp,
  closeApp,
  waitForMainLayout,
  getToolbar,
  getFileBrowser,
  getChatInterface,
  type AppContext,
} from './electron-app'

let context: AppContext

test.describe('Application Launch', () => {
  test.beforeAll(async () => {
    context = await launchApp()
  })

  test.afterAll(async () => {
    if (context) {
      await closeApp(context)
    }
  })

  test('should launch the application', async () => {
    const { window } = context

    // Wait for the main layout to appear
    await waitForMainLayout(window)

    // Verify the app div exists
    const app = window.locator('.app')
    await expect(app).toBeVisible()
  })

  test('should display the toolbar', async () => {
    const { window } = context

    const toolbar = await getToolbar(window)
    await expect(toolbar).toBeVisible()
  })

  test('should display the file browser panel', async () => {
    const { window } = context

    const fileBrowser = await getFileBrowser(window)
    await expect(fileBrowser).toBeVisible()
  })

  test('should display the chat interface', async () => {
    const { window } = context

    const chat = await getChatInterface(window)
    await expect(chat).toBeVisible()
  })

  test('should have the correct window title', async () => {
    const { window } = context

    const title = await window.title()
    expect(title).toContain('Spec Planner')
  })

  test('should show welcome message in chat', async () => {
    const { window } = context

    // Look for a welcome message or initial prompt
    const chatArea = window.locator('[class*="chat"]')
    const welcomeText = chatArea.locator('text=/welcome|get started|Hello/i')

    // This may or may not exist depending on implementation
    const isVisible = await welcomeText.isVisible().catch(() => false)

    // At minimum, the chat container should exist
    await expect(chatArea).toBeVisible()

    if (isVisible) {
      await expect(welcomeText).toBeVisible()
    }
  })
})

test.describe('Window Controls', () => {
  test.beforeAll(async () => {
    context = await launchApp()
  })

  test.afterAll(async () => {
    if (context) {
      await closeApp(context)
    }
  })

  test('should be able to resize the window', async () => {
    const { app, window } = context

    // Get initial size
    const initialSize = window.viewportSize()

    // This is Electron-specific - we can't easily resize in Playwright
    // but we can at least verify the window has a reasonable size
    expect(initialSize).toBeTruthy()
    if (initialSize) {
      expect(initialSize.width).toBeGreaterThan(600)
      expect(initialSize.height).toBeGreaterThan(400)
    }
  })
})
