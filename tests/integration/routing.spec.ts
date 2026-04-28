import { expect, test } from '@playwright/test'

import { HYDRATION_TIMEOUT, mockExternalRequests, cleanupExternalRequestMocks } from './setup'

test.describe('locale routing', () => {
    test.beforeEach(async ({ page }) => {
        await mockExternalRequests(page).mockAll()
    })

    test.afterEach(async ({ page }) => {
        cleanupExternalRequestMocks(page)
    })

    test('homepage redirects to the default locale map', async ({ page }) => {
        await page.goto('/')
        await page.waitForURL('**/de/map')
        await expect(page).toHaveURL(/\/de\/map/)
    })

    test('map page redirects to the default locale map', async ({ page }) => {
        await page.goto('/')
        await page.waitForURL('**/de/map')
        await expect(page).toHaveURL(/\/de\/map/)
    })

    test('locale page redirects to locale + map', async ({ page }) => {
        await page.goto('/de')
        await page.waitForURL('**/de/map')
        await expect(page).toHaveURL(/\/de\/map/)
    })

    test("dataset page doesn't redirect", async ({ page }) => {
        await page.goto('/de/dataset/ch.bafu.neophyten-grossbluetiges_heusenkraut')
        await page.waitForURL('**/de/dataset/ch.bafu.neophyten-grossbluetiges_heusenkraut')
        await expect(page).toHaveURL(/\/de\/dataset/)
    })

    test('dataset page redirects to localized dataset page', async ({ page }) => {
        await page.goto('/dataset/ch.bafu.neophyten-grossbluetiges_heusenkraut')
        await page.waitForURL('**/de/dataset/ch.bafu.neophyten-grossbluetiges_heusenkraut')
        await expect(page).toHaveURL(/\/de\/dataset\/ch.bafu.neophyten-grossbluetiges_heusenkraut/)
    })

    test('navigating to /fr/map shows French sidebar labels', async ({ page }) => {
        await page.goto('/fr/map')
        await expect(page.getByRole('button', { name: 'Recherche' })).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
        await expect(page.getByRole('button', { name: 'Couches actives' })).toBeVisible()
    })

    test('navigating to /en/map shows English sidebar labels', async ({ page }) => {
        await page.goto('/en/map')
        await expect(page.getByRole('button', { name: 'Search' })).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
        await expect(page.getByRole('button', { name: 'Active layers' })).toBeVisible()
    })
})
