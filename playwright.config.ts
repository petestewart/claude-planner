import { defineConfig } from '@playwright/test'

/**
 * Playwright configuration for E2E testing of Electron app
 *
 * This configuration is tailored for testing Electron applications,
 * which requires a different setup than typical web browser testing.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',

  // Timeout for each test
  timeout: 60000,

  // Timeout for expect() assertions
  expect: {
    timeout: 10000,
  },

  // Run tests in files in parallel
  fullyParallel: false, // Electron tests should run sequentially

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Limit workers for Electron tests
  workers: 1,

  // Reporter to use
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }]],

  // Global setup/teardown
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  // Test output directories
  outputDir: 'e2e-results/',

  // Don't use browser-based projects for Electron
  // Each test file handles its own Electron app instance
  use: {
    // Trace on first retry
    trace: 'on-first-retry',
    // Screenshot on failure
    screenshot: 'only-on-failure',
    // Video on failure
    video: 'on-first-retry',
  },
})
