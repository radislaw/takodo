import { expect, test } from '@playwright/test'

test('app loads and redirects to design tokens', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/design\/tokens/)
  await expect(page.locator('body')).toBeVisible()
})
