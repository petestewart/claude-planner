/**
 * Global teardown for Playwright E2E tests
 *
 * This file runs once after all tests have completed.
 */

export default async function globalTeardown(): Promise<void> {
  console.log('\n🧹 E2E tests cleanup complete\n')
}
