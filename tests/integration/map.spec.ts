import { expect, test } from '@playwright/test'

// Dev-mode Vite cold starts can take a while to hydrate the ClientOnly map
// content; prod preview is much faster. The guard here covers both.
const HYDRATION_TIMEOUT = 60_000

/**
 * Mock external API requests so integration tests don't depend on real
 * services. Internal Nuxt server routes (/api/v1/*) call external backends
 * server-side, so we only need to intercept client-side requests that
 * leave the browser (e.g. OGC catalog, tile/style JSON, MapTiler).
 */
async function mockExternalRequests(page: import('@playwright/test').Page) {
    // OGC catalog / dataset requests
    await page.route('**/api/oar/**', (route) =>
        route.fulfill({ status: 200, json: { collections: [], links: [] } })
    )

    // MapTiler tile requests
    await page.route('**/api.maptiler.com/**', (route) => route.fulfill({ status: 200, body: '' }))
}

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

test.describe('locale routing', () => {
    test.beforeEach(async ({ page }) => {
        await mockExternalRequests(page)
    })

    test('homepage redirects to the default locale map', async ({ page }) => {
        await page.goto('/')
        await page.waitForURL('**/de/map')
        await expect(page).toHaveURL(/\/de\/map/)
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
