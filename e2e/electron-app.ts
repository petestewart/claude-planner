/**
 * Electron App Helper for E2E Tests
 *
 * This module provides utilities for launching and interacting with
 * the Electron application in Playwright tests.
 */

import { _electron as electron, type ElectronApplication, type Page } from 'playwright-core'
import path from 'path'

export interface AppContext {
  app: ElectronApplication
  window: Page
}

/**
 * Launch the Electron application for testing
 */
export async function launchApp(): Promise<AppContext> {
  const mainPath = path.join(__dirname, '..', 'dist', 'main', 'index.js')

  const app = await electron.launch({
    args: [mainPath],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  })

  // Wait for the first window to be ready
  const window = await app.firstWindow()

  // Wait for the app to fully load
  await window.waitForLoadState('domcontentloaded')

  // Wait a bit more for React to render
  await window.waitForTimeout(1000)

  return { app, window }
}

/**
 * Close the Electron application
 */
export async function closeApp(context: AppContext): Promise<void> {
  await context.app.close()
}

/**
 * Get the current window from the app
 */
export async function getWindow(app: ElectronApplication): Promise<Page> {
  const windows = app.windows()
  if (windows.length === 0) {
    throw new Error('No windows available')
  }
  return windows[0]
}

/**
 * Wait for the main layout to be visible
 */
export async function waitForMainLayout(window: Page): Promise<void> {
  await window.waitForSelector('.app', { state: 'visible', timeout: 10000 })
}

/**
 * Get the toolbar element
 */
export async function getToolbar(window: Page): Promise<ReturnType<Page['locator']>> {
  return window.locator('[class*="toolbar"]')
}

/**
 * Get the file browser element
 */
export async function getFileBrowser(window: Page): Promise<ReturnType<Page['locator']>> {
  return window.locator('[class*="fileBrowser"]')
}

/**
 * Get the editor area element
 */
export async function getEditorArea(window: Page): Promise<ReturnType<Page['locator']>> {
  return window.locator('[class*="editor"]')
}

/**
 * Get the chat interface element
 */
export async function getChatInterface(window: Page): Promise<ReturnType<Page['locator']>> {
  return window.locator('[class*="chat"]')
}

/**
 * Click on a toolbar button by its aria-label or text
 */
export async function clickToolbarButton(
  window: Page,
  labelOrText: string
): Promise<void> {
  const toolbar = await getToolbar(window)
  const button = toolbar.locator(`button:has-text("${labelOrText}"), button[aria-label*="${labelOrText}"]`)
  await button.click()
}

/**
 * Open a file in the editor by clicking in the file tree
 */
export async function openFile(window: Page, fileName: string): Promise<void> {
  const fileBrowser = await getFileBrowser(window)
  const fileItem = fileBrowser.locator(`text=${fileName}`)
  await fileItem.dblclick()
}

/**
 * Type text in the chat input
 */
export async function typeChatMessage(window: Page, message: string): Promise<void> {
  const chatInput = window.locator('textarea[placeholder*="message"], textarea[class*="input"]')
  await chatInput.fill(message)
}

/**
 * Send the current chat message
 */
export async function sendChatMessage(window: Page): Promise<void> {
  const sendButton = window.locator('button:has-text("Send"), button[aria-label*="send"]')
  await sendButton.click()
}

/**
 * Wait for a response in the chat
 */
export async function waitForChatResponse(window: Page, timeout = 30000): Promise<void> {
  await window.waitForSelector('[class*="message"][class*="assistant"]', {
    state: 'visible',
    timeout,
  })
}

/**
 * Open the settings modal
 */
export async function openSettings(window: Page): Promise<void> {
  // Try keyboard shortcut first
  await window.keyboard.press('Meta+,')

  // Wait for modal to appear
  await window.waitForSelector('[class*="settings"], [role="dialog"]', {
    state: 'visible',
    timeout: 5000,
  })
}

/**
 * Close any open modal
 */
export async function closeModal(window: Page): Promise<void> {
  // Try clicking the close button or pressing Escape
  const closeButton = window.locator('[class*="closeButton"], button[aria-label="Close"]')
  if (await closeButton.isVisible()) {
    await closeButton.click()
  } else {
    await window.keyboard.press('Escape')
  }
}

/**
 * Take a screenshot for debugging
 */
export async function takeScreenshot(
  window: Page,
  name: string
): Promise<Buffer> {
  return window.screenshot({
    path: `e2e-results/screenshots/${name}.png`,
    fullPage: true,
  })
}
