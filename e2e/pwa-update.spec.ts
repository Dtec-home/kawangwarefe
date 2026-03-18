import { test, expect } from '@playwright/test'

test.describe('PWA update prompt', () => {
  test('shows mandatory update overlay when a waiting service worker exists', async ({ page }) => {
    await page.addInitScript(() => {
      const waitingWorker = {
        postMessage: (msg: unknown) => {
          ;(globalThis as { __PWA_LAST_SW_MESSAGE?: unknown }).__PWA_LAST_SW_MESSAGE = msg
        },
      }

      const registration = {
        waiting: waitingWorker,
        installing: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        update: async () => undefined,
      }

      Object.defineProperty(globalThis.navigator, 'serviceWorker', {
        configurable: true,
        value: {
          controller: {},
          register: async () => registration,
          addEventListener: () => {},
          removeEventListener: () => {},
        },
      })
    })

    await page.goto('/')
    await expect(page.getByRole('dialog', { name: /app update required/i })).toBeVisible()
    await expect(page.getByText(/new version available/i)).toBeVisible()
  })

  test('version polling path raises the update overlay when backend build version changes', async ({ page }) => {
    await page.addInitScript(() => {
      // Disable service worker detection so this test exercises version polling only.
      Object.defineProperty(globalThis.navigator, 'serviceWorker', {
        configurable: true,
        value: undefined,
      })

      // Speed up the 5-minute poll interval used by UpdatePrompt.
      const originalSetInterval = globalThis.setInterval.bind(globalThis)
      globalThis.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
        if (timeout === 5 * 60 * 1000) {
          return originalSetInterval(handler, 25, ...args)
        }
        return originalSetInterval(handler, timeout, ...args)
      }) as typeof globalThis.setInterval
    })

    let versionCallCount = 0
    await page.route('**/api/version', async (route) => {
      versionCallCount += 1
      const version = versionCallCount === 1 ? 'build-v1' : 'build-v2'

      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store, no-cache, must-revalidate',
        },
        body: JSON.stringify({ version }),
      })
    })

    await page.goto('/')

    await expect(page.getByRole('dialog', { name: /app update required/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /update now/i })).toBeVisible()
  })
})
