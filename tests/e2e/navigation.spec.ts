import { test, expect } from '@playwright/test'

test.describe('Navigation & Role Access', () => {
  test('loads home page and sidebar successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/LearnX AI/)
    // Verify brand header is visible
    const brand = page.locator('text=LearnX')
    await expect(brand.first()).toBeVisible()
  })

  test('PWA manifest and offline assets are served correctly', async ({ page }) => {
    const response = await page.request.get('/manifest.json')
    expect(response.status()).toBe(200)
    const manifest = await response.json()
    expect(manifest.short_name).toBe('LearnX ERP')
    expect(manifest.display).toBe('standalone')

    const offlineResponse = await page.request.get('/offline.html')
    expect(offlineResponse.status()).toBe(200)
  })
})
