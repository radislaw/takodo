import { expect, test } from '@playwright/test'

const dumpInput = (page: import('@playwright/test').Page) =>
  page.getByPlaceholder('Выгрузи, что крутится в голове…')
const fab = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Новое дело' })

test.describe('mobile (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('brain dump hidden, FAB visible', async ({ page }) => {
    await page.goto('/today')
    await expect(fab(page)).toBeVisible()
    await expect(dumpInput(page)).toBeHidden()
  })
})

test.describe('tablet (768×1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('brain dump visible, FAB visible', async ({ page }) => {
    await page.goto('/today')
    await expect(dumpInput(page)).toBeVisible()
    await expect(fab(page)).toBeVisible()
  })
})

test.describe('desktop (1280×820)', () => {
  test.use({ viewport: { width: 1280, height: 820 } })

  test('brain dump visible, FAB hidden', async ({ page }) => {
    await page.goto('/today')
    await expect(dumpInput(page)).toBeVisible()
    await expect(fab(page)).toBeHidden()
  })
})
