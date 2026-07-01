import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const swPath = path.join(process.cwd(), 'public', 'sw.js')

test.describe('PWA update with real service worker lifecycle', () => {
  test.setTimeout(120_000)

  test('detects a new sw.js and forces update flow end-to-end', async ({ page }) => {
    const originalSw = await fs.readFile(swPath, 'utf8')

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      await page.waitForFunction(async () => {
        if (!('serviceWorker' in navigator)) return false
        const reg = await navigator.serviceWorker.getRegistration('/')
        return Boolean(reg)
      })

      // Wait for an active worker to fully activate before trying to get page control.
      await page.waitForFunction(async () => {
        if (!('serviceWorker' in navigator)) return false
        try {
          const readyReg = await navigator.serviceWorker.ready
          return readyReg.active?.state === 'activated'
        } catch {
          return false
        }
      })

      // Ensure this tab is controlled by the current SW before testing updates.
      // On first visit, a newly installed SW does not control the page until a reload.
      let isControlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller))
      for (let attempt = 0; attempt < 3 && !isControlled; attempt += 1) {
        await page.reload({ waitUntil: 'domcontentloaded' })

        await page.waitForFunction(async () => {
          if (!('serviceWorker' in navigator)) return false
          try {
            const readyReg = await navigator.serviceWorker.ready
            return readyReg.active?.state === 'activated'
          } catch {
            return false
          }
        })

        // Wait for either immediate control or upcoming controllerchange.
        isControlled = await page.evaluate(async () => {
          if (!('serviceWorker' in navigator)) return false
          if (navigator.serviceWorker.controller) return true

          return new Promise<boolean>((resolve) => {
            const timeout = globalThis.setTimeout(() => resolve(Boolean(navigator.serviceWorker.controller)), 5_000)
            navigator.serviceWorker.addEventListener(
              'controllerchange',
              () => {
                globalThis.clearTimeout(timeout)
                resolve(Boolean(navigator.serviceWorker.controller))
              },
              { once: true },
            )
          })
        })
      }

      expect(isControlled).toBeTruthy()

      const uniqueSuffix = `\n// e2e-sw-bump-${Date.now()}\n`
      await fs.writeFile(swPath, `${originalSw}${uniqueSuffix}`, 'utf8')

      await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration('/')
        await reg?.update()
      })

      // Wait until the updated worker enters waiting state.
      await page.waitForFunction(async () => {
        const reg = await navigator.serviceWorker.getRegistration('/')
        return Boolean(reg?.waiting)
      })

      // Re-open with a waiting worker already present so UpdatePrompt's
      // initial `reg.waiting` check always surfaces the overlay.
      await page.reload({ waitUntil: 'domcontentloaded' })

      const dialog = page.getByRole('dialog', { name: /app update required/i })
      await expect(dialog).toBeVisible({ timeout: 20_000 })

      await page.getByRole('button', { name: /update now/i }).click()

      await page.waitForLoadState('domcontentloaded')
      await expect(dialog).toBeHidden({ timeout: 20_000 })
    } finally {
      await fs.writeFile(swPath, originalSw, 'utf8')
    }
  })
})
