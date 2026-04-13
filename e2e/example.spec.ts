import { expect, test } from '@playwright/test'

test('homepage redirects to default locale map', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/de/map')
    await expect(page).toHaveURL(/\/de\/map/)
})

test('map page renders sidebar', async ({ page }) => {
    await page.goto('/de/map')
    await expect(page.getByRole('button', { name: 'Suche' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aktive Ebenen' })).toBeVisible()
})
