import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const swPath = path.join(process.cwd(), 'public', 'sw.js')

test.describe('PWA update with real service worker lifecycle', () => {
  test.setTimeout(120_000)

  test('detects a new sw.js and forces update flow end-to-end', async ({ page }) => {
    const originalSw = await fs.readFile(swPath, 'utf8')

    try {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      await page.waitForFunction(async () => {
        if (!('serviceWorker' in navigator)) return false
        const reg = await navigator.serviceWorker.getRegistration('/')
        return Boolean(reg)
      })

      const uniqueSuffix = `\n// e2e-sw-bump-${Date.now()}\n`
      await fs.writeFile(swPath, `${originalSw}${uniqueSuffix}`, 'utf8')

      await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration('/')
        await reg?.update()
      })

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
