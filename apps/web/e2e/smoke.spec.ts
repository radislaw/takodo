import { expect, test } from '@playwright/test'

test('app loads and redirects to today', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/today/)
  await expect(page.locator('body')).toBeVisible()
})
