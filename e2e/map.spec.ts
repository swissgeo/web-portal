import { expect, test } from '@playwright/test'

// Dev-mode Vite cold starts can take a while to hydrate the ClientOnly map
// content, so the first assertion after navigation gets a generous timeout.
const HYDRATION_TIMEOUT = 60_000

test.describe('map page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/de/map')
    })

    test('renders the OpenLayers map canvas', async ({ page }) => {
        await expect(page.locator('[data-cy="ol-map"]')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
    })

    test('displays the toolbox with zoom controls', async ({ page }) => {
        await expect(page.locator('[data-cy="toolbox-right"]')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
        await expect(page.locator('[data-testid="button-icon-i-lucide-plus"]')).toBeVisible()
        await expect(page.locator('[data-testid="button-icon-i-lucide-minus"]')).toBeVisible()
    })

    test('displays the fullscreen button', async ({ page }) => {
        await expect(page.locator('[data-testid="button-icon-i-lucide-expand"]')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
    })

    test('clicking the search tab reveals the search input', async ({ page }) => {
        await expect(page.locator('[data-cy="ol-map"]')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })

        const searchTab = page.getByRole('button', { name: 'Suche' })
        await searchTab.click()

        const searchInput = page.getByPlaceholder('Ort, Layer oder Koordinaten suchen...')
        await expect(searchInput).toBeVisible()
        await searchInput.fill('Bern')
        await expect(searchInput).toHaveValue('Bern')
    })

    test('sidebar tabs switch between search and layers', async ({ page }) => {
        await expect(page.locator('[data-cy="ol-map"]')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })

        const searchTab = page.getByRole('button', { name: 'Suche' })
        const layerTab = page.getByRole('button', { name: 'Aktive Ebenen' })
        const searchInput = page.getByPlaceholder('Ort, Layer oder Koordinaten suchen...')

        await searchTab.click()
        await expect(searchInput).toBeVisible()

        await layerTab.click()
        await expect(searchInput).not.toBeVisible()
    })
})

test.describe('locale routing', () => {
    test('navigating to /fr/map shows French sidebar labels', async ({ page }) => {
        await page.goto('/fr/map')
        await expect(page.getByRole('button', { name: 'Recherche' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Couches actives' })).toBeVisible()
    })

    test('navigating to /en/map shows English sidebar labels', async ({ page }) => {
        await page.goto('/en/map')
        await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Active layers' })).toBeVisible()
    })
})
