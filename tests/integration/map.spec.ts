import { expect, test } from '@playwright/test'

import { HYDRATION_TIMEOUT, mockExternalRequests } from './setup'

test.describe('map page', () => {
    test.beforeEach(async ({ page }) => {
        await mockExternalRequests(page)
        await page.goto('/de/map')
        await expect(page.locator('[data-cy="ol-map"]')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
    })

    test('renders the OpenLayers map canvas', async ({ page }) => {
        await expect(page.locator('[data-cy="ol-map"]')).toBeVisible()
    })

    test('displays the toolbox with zoom controls', async ({ page }) => {
        await expect(page.locator('[data-cy="toolbox-right"]')).toBeVisible()
        await expect(page.locator('[data-cy="zoom-in"]')).toBeVisible()
        await expect(page.locator('[data-cy="zoom-out"]')).toBeVisible()
    })

    test('displays the fullscreen button', async ({ page }) => {
        await expect(page.locator('[data-cy="fullscreen-toggle"]')).toBeVisible()
    })

    test('clicking the search tab reveals the search input', async ({ page }) => {
        const searchTab = page.getByRole('button', { name: 'Suche' })
        await searchTab.click()

        const searchInput = page.getByPlaceholder('Ort, Layer oder Koordinaten suchen...')
        await expect(searchInput).toBeVisible()
        await searchInput.fill('Bern')
        await expect(searchInput).toHaveValue('Bern')
    })

    test('sidebar tabs switch between search and layers', async ({ page }) => {
        const searchTab = page.getByRole('button', { name: 'Suche' })
        const layerTab = page.getByRole('button', { name: 'Aktive Ebenen' })
        const searchInput = page.getByPlaceholder('Ort, Layer oder Koordinaten suchen...')

        await searchTab.click()
        await expect(searchInput).toBeVisible()

        await layerTab.click()
        await expect(searchInput).not.toBeVisible()
    })
})
