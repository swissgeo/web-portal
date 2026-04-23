import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const HYDRATION_TIMEOUT = 60_000

async function mockExternalRequests(page: import('@playwright/test').Page) {
    await page.route('**/api/oar/**', (route) =>
        route.fulfill({ status: 200, json: { collections: [], links: [] } })
    )
}

async function openDrawingPanel(page: import('@playwright/test').Page) {
    await page.locator('[data-cy="debug-open-drawing-panel"]').click()
    await expect(page.locator('[data-cy="drawing-panel"]')).toBeVisible()
}

/**
 * Select the Point tool and place one point on the map.
 *
 * The drawing panel sits at the bottom-center of the viewport (~400 px tall),
 * so we click in the top-right quadrant to stay clear of both the panel and
 * the left sidebar. We also wait for the instruction text to appear first,
 * which confirms that OpenLayers has wired up the drawing interaction.
 */
async function drawOnePoint(page: import('@playwright/test').Page) {
    await page.locator('[data-cy="drawing-tool-point"]').click()
    await expect(page.getByText('Click on the map to add a point')).toBeVisible()

    const map = page.locator('[data-cy="ol-map"]')
    const mapBox = await map.boundingBox()
    if (!mapBox) {
        throw new Error('Could not get map bounding box')
    }

    await map.click({
        position: {
            x: mapBox.width * 0.75,
            y: mapBox.height * 0.25,
        },
    })
}

test.describe('drawing panel', () => {
    test.beforeEach(async ({ page }) => {
        await mockExternalRequests(page)
        await page.goto('/en/map')
        await expect(page.locator('[data-cy="ol-map"]')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
    })

    test('opens the drawing panel from the debug panel', async ({ page }) => {
        await page.locator('[data-cy="debug-open-drawing-panel"]').click()
        await expect(page.locator('[data-cy="drawing-panel"]')).toBeVisible()
        await expect(page.getByText('Drawing Tools')).toBeVisible()
    })

    test('drawing panel shows all tool buttons', async ({ page }) => {
        await openDrawingPanel(page)
        await expect(page.locator('[data-cy="drawing-tool-point"]')).toBeVisible()
        await expect(page.locator('[data-cy="drawing-tool-line"]')).toBeVisible()
        await expect(page.locator('[data-cy="drawing-tool-text"]')).toBeVisible()
        await expect(page.locator('[data-cy="drawing-tool-measurement"]')).toBeVisible()
    })

    test('drawing panel shows name input with default value', async ({ page }) => {
        await openDrawingPanel(page)
        const nameInput = page.locator('[data-cy="drawing-name-input"]')
        await expect(nameInput).toBeVisible()
        await expect(nameInput).toHaveValue('My Drawings')
    })

    test('drawing name can be changed', async ({ page }) => {
        await openDrawingPanel(page)
        const nameInput = page.locator('[data-cy="drawing-name-input"]')
        await nameInput.fill('Matterhorn Route')
        await expect(nameInput).toHaveValue('Matterhorn Route')
    })

    test('export and clear buttons are disabled when there are no features', async ({ page }) => {
        await openDrawingPanel(page)
        await expect(page.locator('[data-cy="drawing-export-kml"]')).toBeDisabled()
        await expect(page.locator('[data-cy="drawing-export-kmz"]')).toBeDisabled()
        await expect(page.locator('[data-cy="drawing-export-gpx"]')).toBeDisabled()
        await expect(page.locator('[data-cy="drawing-clear-all"]')).toBeDisabled()
    })

    test('feature count starts at zero', async ({ page }) => {
        await openDrawingPanel(page)
        await expect(page.locator('[data-cy="drawing-feature-count"]')).toHaveText('0')
    })

    test('clicking a tool button activates it', async ({ page }) => {
        await openDrawingPanel(page)
        const pointButton = page.locator('[data-cy="drawing-tool-point"]')
        await pointButton.click()
        await expect(pointButton).toHaveClass(/bg-blue-500/)
    })

    test('clicking an active tool button deactivates it', async ({ page }) => {
        await openDrawingPanel(page)
        const pointButton = page.locator('[data-cy="drawing-tool-point"]')
        await pointButton.click()
        await expect(pointButton).toHaveClass(/bg-blue-500/)
        await pointButton.click()
        await expect(pointButton).not.toHaveClass(/bg-blue-500/)
    })

    test('only one tool can be active at a time', async ({ page }) => {
        await openDrawingPanel(page)
        await page.locator('[data-cy="drawing-tool-point"]').click()
        await expect(page.locator('[data-cy="drawing-tool-point"]')).toHaveClass(/bg-blue-500/)

        await page.locator('[data-cy="drawing-tool-line"]').click()
        await expect(page.locator('[data-cy="drawing-tool-line"]')).toHaveClass(/bg-blue-500/)
        await expect(page.locator('[data-cy="drawing-tool-point"]')).not.toHaveClass(/bg-blue-500/)
    })

    test('shows drawing instruction when a tool is active', async ({ page }) => {
        await openDrawingPanel(page)
        await page.locator('[data-cy="drawing-tool-point"]').click()
        await expect(page.getByText('Click on the map to add a point')).toBeVisible()
    })

    test('closing the drawing panel hides it', async ({ page }) => {
        await openDrawingPanel(page)
        await page.locator('[data-cy="drawing-close-button"]').click()
        await expect(page.locator('[data-cy="drawing-panel"]')).not.toBeVisible()
    })

    test('hides the fullscreen button while the drawing panel is open', async ({ page }) => {
        await expect(page.locator('[data-cy="fullscreen-toggle"]')).toBeVisible()
        await openDrawingPanel(page)
        await page.locator('[data-cy="drawing-tool-point"]').click()
        await expect(page.locator('[data-cy="fullscreen-toggle"]')).not.toBeVisible()
    })

    test('drawing a point on the map increases the feature count', async ({ page }) => {
        await openDrawingPanel(page)
        await drawOnePoint(page)
        await expect(page.locator('[data-cy="drawing-feature-count"]')).not.toHaveText('0')
    })

    test('clear all confirmation dialog appears and cancels', async ({ page }) => {
        await openDrawingPanel(page)
        await drawOnePoint(page)

        await expect(page.locator('[data-cy="drawing-feature-count"]')).not.toHaveText('0')
        await expect(page.locator('[data-cy="drawing-clear-all"]')).toBeEnabled()

        await page.locator('[data-cy="drawing-clear-all"]').click()
        await expect(page.getByText('Delete all drawings?')).toBeVisible()

        await page.getByRole('button', { name: 'Cancel' }).click()
        await expect(page.locator('[data-cy="drawing-feature-count"]')).not.toHaveText('0')
    })

    test('clear all confirmation dialog deletes all features when confirmed', async ({ page }) => {
        await openDrawingPanel(page)
        await drawOnePoint(page)

        await expect(page.locator('[data-cy="drawing-feature-count"]')).not.toHaveText('0')
        await page.locator('[data-cy="drawing-clear-all"]').click()
        await expect(page.getByText('Delete all drawings?')).toBeVisible()

        await page.getByRole('button', { name: 'Delete' }).click()
        await expect(page.locator('[data-cy="drawing-feature-count"]')).toHaveText('0')
    })
})

test.describe('import drawing files', () => {
    test.beforeEach(async ({ page }) => {
        await mockExternalRequests(page)
        await page.goto('/en/map')
        await expect(page.locator('[data-cy="ol-map"]')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
    })

    test('imports a KML file and shows success message', async ({ page }) => {
        await page.getByRole('button', { name: 'Open Import Local Layers Panel' }).click()
        await expect(page.locator('[data-cy="file-input-browse-button"]')).toBeVisible()

        const fileInput = page.locator('[data-cy="file-input"]')
        await fileInput.setInputFiles(
            fileURLToPath(new URL('../fixtures/test-drawing.kml', import.meta.url))
        )

        await expect(page.locator('[data-cy="file-input-text"]')).toHaveValue('test-drawing.kml')
        await page.getByRole('button', { name: 'Import file' }).click()
        await expect(page.getByText(/Successfully imported test-drawing.kml/)).toBeVisible()
    })

    test('imports a GeoJSON file and shows success message', async ({ page }) => {
        await page.getByRole('button', { name: 'Open Import Local Layers Panel' }).click()
        await expect(page.locator('[data-cy="file-input-browse-button"]')).toBeVisible()

        const fileInput = page.locator('[data-cy="file-input"]')
        await fileInput.setInputFiles(
            fileURLToPath(new URL('../fixtures/test-drawing.geojson', import.meta.url))
        )

        await expect(page.locator('[data-cy="file-input-text"]')).toHaveValue(
            'test-drawing.geojson'
        )
        await page.getByRole('button', { name: 'Import file' }).click()
        await expect(page.getByText(/Successfully imported test-drawing.geojson/)).toBeVisible()
    })

    test('shows an error message when importing an unsupported file type', async ({ page }) => {
        await page.getByRole('button', { name: 'Open Import Local Layers Panel' }).click()
        await expect(page.locator('[data-cy="file-input-browse-button"]')).toBeVisible()

        const fileInput = page.locator('[data-cy="file-input"]')
        await fileInput.setInputFiles({
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('This is not a supported format'),
        })

        await page.getByRole('button', { name: 'Import file' }).click()
        await expect(page.getByText(/Unsupported file type/)).toBeVisible()
    })

    test('import button is disabled when no file is selected', async ({ page }) => {
        await page.getByRole('button', { name: 'Open Import Local Layers Panel' }).click()
        await expect(page.locator('[data-cy="file-input-browse-button"]')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Import file' })).toBeDisabled()
    })
})
