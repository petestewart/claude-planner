/**
 * Electron App Helper for E2E Tests
 *
 * This module provides utilities for launching and interacting with
 * the Electron application in Playwright tests.
 */

import {
  _electron as electron,
  type ElectronApplication,
  type Page,
} from 'playwright-core'
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

  // Listen for console messages to help debug issues
  window.on('console', (msg) => {
    const type = msg.type()
    if (type === 'error' || type === 'warning') {
      console.log(`[Renderer ${type}]:`, msg.text())
    }
  })

  // Listen for page errors
  window.on('pageerror', (error) => {
    console.log('[Renderer page error]:', error.message)
  })

  // Wait for the app to fully load
  await window.waitForLoadState('domcontentloaded')

  // Clear localStorage to prevent persisted Zustand state from interfering with tests
  // This ensures each test suite starts with a clean state
  await window.evaluate(() => {
    localStorage.clear()
  })

  // Reload the page after clearing localStorage to ensure React re-renders with fresh state
  await window.reload()
  await window.waitForLoadState('domcontentloaded')

  // Wait for React to hydrate and render with fresh state
  await window.waitForTimeout(3000)

  // Dismiss all modals that might be blocking the UI
  // This handles both the New Project wizard and any persisted modal state (e.g., Settings)
  await dismissAllModals(window)

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
  await window.waitForSelector('.app', { state: 'visible', timeout: 30000 })
}

/**
 * Get the main toolbar element (the header toolbar, not nested toolbars)
 */
export async function getToolbar(
  window: Page
): Promise<ReturnType<Page['locator']>> {
  // Target the main header toolbar specifically (it's a <header> element)
  return window.locator('header[class*="toolbar"]')
}

/**
 * Get the file browser element
 */
export async function getFileBrowser(
  window: Page
): Promise<ReturnType<Page['locator']>> {
  // Target the file browser container - CSS modules mangle the class names
  // Look for the div with fileBrowser class pattern
  return window.locator('div[class*="fileBrowser"]').first()
}

/**
 * Get the editor area element
 */
export async function getEditorArea(
  window: Page
): Promise<ReturnType<Page['locator']>> {
  // Target the main editor container
  return window.locator('div[class*="editorContainer"]').first()
}

/**
 * Get the chat interface element
 */
export async function getChatInterface(
  window: Page
): Promise<ReturnType<Page['locator']>> {
  // Target the chat container
  return window.locator('div[class*="chatInterface"]').first()
}

/**
 * Click on a toolbar button by its aria-label or text
 */
export async function clickToolbarButton(
  window: Page,
  labelOrText: string
): Promise<void> {
  const toolbar = await getToolbar(window)
  const button = toolbar.locator(
    `button:has-text("${labelOrText}"), button[aria-label*="${labelOrText}"]`
  )
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
export async function typeChatMessage(
  window: Page,
  message: string
): Promise<void> {
  const chatInput = window.locator(
    'textarea[placeholder*="message"], textarea[class*="input"]'
  )
  await chatInput.fill(message)
}

/**
 * Send the current chat message
 */
export async function sendChatMessage(window: Page): Promise<void> {
  const sendButton = window.locator(
    'button:has-text("Send"), button[aria-label*="send"]'
  )
  await sendButton.click()
}

/**
 * Wait for a response in the chat
 */
export async function waitForChatResponse(
  window: Page,
  timeout = 30000
): Promise<void> {
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
  const closeButton = window.locator(
    '[class*="closeButton"], button[aria-label="Close"]'
  )
  if (await closeButton.isVisible()) {
    await closeButton.click()
  } else {
    await window.keyboard.press('Escape')
  }
}

/**
 * Dismiss the New Project wizard if it's visible
 * This wizard appears on first launch and blocks interaction with the app
 */
export async function dismissWizardIfVisible(window: Page): Promise<void> {
  // Check if the wizard overlay is present
  const wizardOverlay = window.locator('[class*="wizardOverlay"]')
  const cancelButton = window.locator('button:has-text("Cancel")')
  const closeButton = window.locator(
    '[class*="wizard"] button[class*="close"], [class*="wizard"] button:has-text("X")'
  )

  try {
    // Give the wizard a moment to appear
    await window.waitForTimeout(500)

    if (await wizardOverlay.isVisible({ timeout: 1000 })) {
      // Try Cancel button first
      if (await cancelButton.isVisible({ timeout: 500 })) {
        await cancelButton.click()
        await window.waitForTimeout(300)
        return
      }

      // Try close button
      if (await closeButton.isVisible({ timeout: 500 })) {
        await closeButton.click()
        await window.waitForTimeout(300)
        return
      }

      // Fall back to Escape key
      await window.keyboard.press('Escape')
      await window.waitForTimeout(300)
    }
  } catch {
    // Wizard not present, continue
  }
}

/**
 * Dismiss the Settings modal if it's visible
 * This handles state leakage between test suites when Settings modal is left open
 */
export async function dismissSettingsIfVisible(window: Page): Promise<void> {
  try {
    // Look for the Settings modal dialog
    const settingsDialog = window.locator(
      '[role="dialog"][aria-labelledby="settings-title"]'
    )

    if (await settingsDialog.isVisible({ timeout: 500 })) {
      // Try clicking the Close button first
      const closeButton = settingsDialog.locator('button:has-text("Close")')
      if (await closeButton.isVisible({ timeout: 300 })) {
        await closeButton.click()
        await window.waitForTimeout(300)

        // Verify modal is closed
        if (
          !(await settingsDialog.isVisible({ timeout: 300 }).catch(() => false))
        ) {
          return
        }
      }

      // Try the X close button
      const xButton = settingsDialog.locator(
        'button[aria-label="Close settings"]'
      )
      if (await xButton.isVisible({ timeout: 300 })) {
        await xButton.click()
        await window.waitForTimeout(300)

        if (
          !(await settingsDialog.isVisible({ timeout: 300 }).catch(() => false))
        ) {
          return
        }
      }

      // Fall back to Escape key
      await window.keyboard.press('Escape')
      await window.waitForTimeout(300)
    }
  } catch {
    // Settings modal not present, continue
  }
}

/**
 * Dismiss all modal dialogs that might be blocking the UI
 * This should be called at the start of each test to ensure a clean state
 */
export async function dismissAllModals(window: Page): Promise<void> {
  // Dismiss any modal dialog by pressing Escape multiple times
  // This handles cases where multiple modals might be stacked or persisted state
  for (let i = 0; i < 3; i++) {
    const dialog = window.locator('[role="dialog"]')
    if (await dialog.isVisible({ timeout: 300 }).catch(() => false)) {
      await window.keyboard.press('Escape')
      await window.waitForTimeout(200)
    } else {
      break
    }
  }

  // Now specifically check for known modals
  await dismissSettingsIfVisible(window)
  await dismissWizardIfVisible(window)
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
