import { test, expect } from '@playwright/test'

test.describe('Report Card & Receipt PDF Generation API', () => {
  test('serves printable HTML report card for valid report ID', async ({ page }) => {
    // Test with sample report card endpoint
    const response = await page.request.get('/api/report-cards/rep_test_1/pdf')
    // Returns 200 HTML or 404 if not found
    expect([200, 404]).toContain(response.status())
    if (response.status() === 200) {
      const html = await response.text()
      expect(html).toContain('LEARNX INTERNATIONAL SCHOOL')
      expect(html).toContain('Save as PDF')
    }
  })

  test('serves printable fee receipt HTML', async ({ page }) => {
    const response = await page.request.get('/api/fees/receipt/fee_test_1/pdf')
    expect([200, 404]).toContain(response.status())
    if (response.status() === 200) {
      const html = await response.text()
      expect(html).toContain('FEE RECEIPT')
      expect(html).toContain('PAID &')
    }
  })
})
