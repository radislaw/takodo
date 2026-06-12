import { expect, test } from '@playwright/test'

const hint = (page: import('@playwright/test').Page) => page.getByText('Выбери задачу из списка')

test.describe('mobile (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('no desktop placeholder hint', async ({ page }) => {
    await page.goto('/tasks')
    await expect(hint(page)).toBeHidden()
  })
})

test.describe('desktop (1280×820)', () => {
  test.use({ viewport: { width: 1280, height: 820 } })

  test('shows select-hint placeholder on /tasks', async ({ page }) => {
    await page.goto('/tasks')
    await expect(hint(page)).toBeVisible()
  })
})
