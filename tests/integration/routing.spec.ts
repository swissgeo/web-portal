import { expect, test } from '@playwright/test'

import { HYDRATION_TIMEOUT, mockExternalRequests, cleanupExternalRequestMocks } from './setup'

test.describe('locale routing', () => {
    // Pin the browser locale so unlocalized-path redirects are deterministic.
    // Without this, chromium defaults to en-US and GPS-666's Accept-Language
    // resolution sends `/dataset/x` to `/en/dataset/x` instead of `/de/...`.
    test.use({ locale: 'de-CH' })

    test.beforeEach(async ({ page }) => {
        await mockExternalRequests(page).mockAll()
    })

    test.afterEach(async ({ page }) => {
        await cleanupExternalRequestMocks(page)
    })

    test('homepage redirects to the default locale map', async ({ page }) => {
        await page.goto('/')
        await page.waitForURL('**/de/map')
        await expect(page).toHaveURL(/\/de\/map/)
    })

    test('map page redirects to the default locale map', async ({ page }) => {
        await page.goto('/map')
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

test.describe('locale routing — browser language detection (GPS-666)', () => {
    test.beforeEach(async ({ page }) => {
        await mockExternalRequests(page).mockAll()
    })

    test.afterEach(async ({ page }) => {
        await cleanupExternalRequestMocks(page)
    })

    for (const from of ['/', '/map']) {
        test.describe(`${from} redirects`, () => {
            test.describe('uses the browser language', () => {
                test.use({ locale: 'fr-CH' })

                test(`${from} → /fr/map`, async ({ page }) => {
                    await page.goto(from)
                    await page.waitForURL('**/fr/map')
                    await expect(page).toHaveURL(/\/fr\/map/)
                })
            })

            test.describe('falls back to the default locale for unsupported browser language', () => {
                test.use({ locale: 'es-ES' })

                test(`${from} → /de/map`, async ({ page }) => {
                    await page.goto(from)
                    await page.waitForURL('**/de/map')
                    await expect(page).toHaveURL(/\/de\/map/)
                })
            })

            test.describe('preserves query string across the redirect', () => {
                test.use({ locale: 'fr-CH' })

                test(`${from}?state=foo → /fr/map?state=foo`, async ({ page }) => {
                    await page.goto(`${from}?state=foo`)
                    await page.waitForURL('**/fr/map?state=foo')
                    await expect(page).toHaveURL(/\/fr\/map\?state=foo/)
                })
            })
        })
    }
})
