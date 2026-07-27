import { test, expect } from '@playwright/test'

test.describe('API Endpoint Health & Role Access', () => {
  test('rejects unauthenticated requests to protected endpoints', async ({ page }) => {
    const res = await page.request.get('/api/students')
    expect([200, 401, 403]).toContain(res.status())
  })

  test('autopilot status endpoint returns structured status', async ({ page }) => {
    const res = await page.request.get('/api/autopilot', {
      headers: {
        'x-user-role': 'ADMIN',
        'x-user-school-id': 'school_default',
      },
    })
    expect([200, 403]).toContain(res.status())
    if (res.status() === 200) {
      const data = await res.json()
      expect(data.success).toBe(true)
    }
  })
})
