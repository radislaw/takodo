import { expect, test } from '@playwright/test'

const sidebar = (page: import('@playwright/test').Page) => page.locator('nav.surface-card')
const bottomNav = (page: import('@playwright/test').Page) => page.locator('nav.surface-nav')

test.describe('mobile (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('bottom nav visible, sidebar hidden', async ({ page }) => {
    await page.goto('/today')
    await expect(bottomNav(page)).toBeVisible()
    await expect(sidebar(page)).toBeHidden()
  })
})

test.describe('tablet (768×1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('bottom nav visible, sidebar hidden', async ({ page }) => {
    await page.goto('/today')
    await expect(bottomNav(page)).toBeVisible()
    await expect(sidebar(page)).toBeHidden()
  })
})

test.describe('desktop (1280×820)', () => {
  test.use({ viewport: { width: 1280, height: 820 } })

  test('sidebar visible, bottom nav hidden', async ({ page }) => {
    await page.goto('/today')
    await expect(sidebar(page)).toBeVisible()
    await expect(bottomNav(page)).toBeHidden()
  })

  test('do-mode shows neither sidebar nor bottom nav', async ({ page }) => {
    await page.goto('/do')
    await expect(sidebar(page)).toHaveCount(0)
    await expect(bottomNav(page)).toHaveCount(0)
  })

  test('sidebar click navigates to tasks', async ({ page }) => {
    await page.goto('/today')
    await sidebar(page).getByRole('button', { name: 'Задачи' }).click()
    await expect(page).toHaveURL(/\/tasks/)
  })
})
