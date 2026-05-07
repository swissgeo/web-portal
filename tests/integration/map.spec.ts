import { expect, test } from '@playwright/test'

import { HYDRATION_TIMEOUT, mockExternalRequests, cleanupExternalRequestMocks } from './setup'

test.describe('map page', () => {
    test.beforeEach(async ({ page }) => {
        await mockExternalRequests(page).mockAll()
        await page.goto('/de/map')
        await expect(page.locator('[data-cy="ol-map"]')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
    })

    test.afterEach(async ({ page }) => {
        await cleanupExternalRequestMocks(page)
    })

    test.skip('renders the OpenLayers map canvas', async ({ page }) => {
        await expect(page.locator('[data-cy="ol-map"]')).toBeVisible()
    })

    test.skip('displays the toolbox with zoom controls', async ({ page }) => {
        await expect(page.locator('[data-cy="toolbox-right"]')).toBeVisible()
        await expect(page.locator('[data-cy="zoom-in"]')).toBeVisible()
        await expect(page.locator('[data-cy="zoom-out"]')).toBeVisible()
    })

    test.skip('displays the fullscreen button', async ({ page }) => {
        await expect(page.locator('[data-cy="fullscreen-toggle"]')).toBeVisible()
    })

    test.only('displays the map with the defaults', async ({ page }) => {
        const mapRef = await page.evaluateHandle(() => window.swissgeoOlMap)
        const zoom = await page.evaluate((map) => map.getView().getZoom(), mapRef)
        const center = await page.evaluate((map) => map.getView().getCenter(), mapRef)
        await expect(zoom).toEqual(1)
        await expect(center).toEqual([2660000, 1190000])
    })
})
