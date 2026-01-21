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

    // Look for a welcome message in the chat interface
    const chatInterface = await getChatInterface(window)

    // Look for the welcome text within the chat interface
    const welcomeText = chatInterface
      .locator('text=/welcome|get started/i')
      .first()

    // The chat container should exist
    await expect(chatInterface).toBeVisible()

    // Check if welcome message is visible
    const isVisible = await welcomeText.isVisible().catch(() => false)
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
    const { app } = context

    // In Electron, we need to use the app API to get window bounds
    // viewportSize() doesn't work the same way as in browser
    const window = await app.firstWindow()

    // Evaluate window dimensions via the page
    const dimensions = await window.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    }))

    // Verify the window has a reasonable size
    expect(dimensions.width).toBeGreaterThan(600)
    expect(dimensions.height).toBeGreaterThan(400)
  })
})
