import { expect, test } from '@playwright/test'

const heatmapTitle = (page: import('@playwright/test').Page) => page.getByText('Твоя активность')
const streakSub = (page: import('@playwright/test').Page) =>
  page.getByText('Маленькие шаги складываются')

test.describe('desktop (1280×820)', () => {
  test.use({ viewport: { width: 1280, height: 820 } })

  test('streak hero and heatmap sit side by side', async ({ page }) => {
    await page.goto('/rewards')
    await expect(streakSub(page)).toBeVisible()
    await expect(heatmapTitle(page)).toBeVisible()
    const heroBox = await streakSub(page).boundingBox()
    const heatBox = await heatmapTitle(page).boundingBox()
    // Hero rail is to the right of the heatmap main column.
    expect(heroBox!.x).toBeGreaterThan(heatBox!.x)
  })
})

test.describe('mobile (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('stacks hero above heatmap', async ({ page }) => {
    await page.goto('/rewards')
    const heroBox = await streakSub(page).boundingBox()
    const heatBox = await heatmapTitle(page).boundingBox()
    expect(heroBox!.y).toBeLessThan(heatBox!.y)
  })
})
