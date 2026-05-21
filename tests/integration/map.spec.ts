import type { Page, Route } from '@playwright/test'
import type BaseLayer from 'ol/layer/Base'

import { expect, test } from '@playwright/test'
import { readFileSync } from 'fs'

import ChSwisstopoPixelkarteFarbeDataset from '../fixtures/item-dataset-ch.swisstopo.pixelkarte-farbe.json' with { type: 'json' }
import ChSwisstopoPixelkarteFarbeDistribution from '../fixtures/item-distribution-ch.swisstopo.pixelkarte-farbe.json' with { type: 'json' }
import ChWmtsGeoadmin from '../fixtures/wmts-geoadminch.json' with { type: 'json' }
const WMTSCapabilities = readFileSync(
    new URL('../fixtures/WMTSCapabilities.xml', import.meta.url),
    'utf-8'
)

const tileFixture = readFileSync(new URL('../fixtures/tile.jpeg', import.meta.url))

import { HYDRATION_TIMEOUT, mockExternalRequests, cleanupExternalRequestMocks } from './setup'

test.describe('map page', () => {
    const mockBackgroundRoutes = async (page: Page) => {
        const mockBackgroundResponse = (route: Route) =>
            route.fulfill({ status: 200, json: ChSwisstopoPixelkarteFarbeDataset })

        const mockWmtsResponse = (route: Route) =>
            route.fulfill({ status: 200, json: ChWmtsGeoadmin })

        // The actual mocks
        await page.route(
            'http://mock-oar.org/api/oar/v0/collections/geoadmin.services/items/wmts-geoadminch',
            mockWmtsResponse
        )

        await page.route(
            'http://mock-oar.org/api/oar/v0/collections/ch.swisstopo.pixelkarte-farbe*',
            (route) =>
                route.fulfill({
                    status: 200,
                    json: ChSwisstopoPixelkarteFarbeDistribution,
                })
        )

        // we let all the backgrounds to return the data for pixelkarte-farbe
        await page.route('http://mock-oar.org/api/oar/items/ch.swisstopo.*', mockBackgroundResponse)

        await page.route('https://wmts.geo.admin.ch/**/WMTSCapabilities.xml', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/xml',
                body: WMTSCapabilities,
            })
        )

        // mock the tiles
        await page.route('https://wmts.geo.admin.ch/1.0.0/**.jpeg', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'image/jpeg',
                body: tileFixture,
            })
        )
    }

    test.beforeEach(async ({ page }) => {
        await mockExternalRequests(page).mockAll()
        // override the OAR routes
        await mockBackgroundRoutes(page)

        await page.goto('/de/map')
        await expect(page.getByTestId('ol-map')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
    })

    test.afterEach(async ({ page }) => {
        await cleanupExternalRequestMocks(page)
    })

    test.skip('renders the OpenLayers map canvas', async ({ page }) => {
        await expect(page.getByTestId('ol-map')).toBeVisible()
    })

    test.skip('displays the toolbox with zoom controls', async ({ page }) => {
        await expect(page.getByTestId('toolbox-right')).toBeVisible()
        await expect(page.getByTestId('zoom-in')).toBeVisible()
        await expect(page.getByTestId('zoom-out')).toBeVisible()
    })

    test.skip('displays the fullscreen button', async ({ page }) => {
        await expect(page.getByTestId('fullscreen-toggle')).toBeVisible()
    })

    test('displays the map with the defaults', async ({ page }) => {
        await page.waitForFunction(() => window.swissgeoOlMap !== undefined, null, {
            timeout: 20000,
        })
        const mapRef = await page.evaluateHandle(() => window.swissgeoOlMap)
        const zoom = await page.evaluate((map) => map.getView().getZoom(), mapRef)
        const center = await page.evaluate((map) => map.getView().getCenter(), mapRef)
        expect(zoom).toEqual(1)
        expect(center).toEqual([2660000, 1190000])
    })

    test('Loads the pixelkarte-farbe as default background', async ({ page }) => {
        await page.waitForFunction(() => window.swissgeoOlMap !== undefined, null, {
            timeout: 20000,
        })
        const mapRef = await page.evaluateHandle(() => window.swissgeoOlMap)
        const layers = await page.evaluate((map) => {
            const arr = map.getLayers().getArray()
            return arr.map((layer: BaseLayer) => ({
                name: layer.get('id'),
                opacity: layer.getOpacity(),
                visible: layer.getVisible(),
            }))
        }, mapRef)

        expect(layers).toHaveLength(1)
        expect(layers[0].name).toEqual('ch.swisstopo.pixelkarte-farbe')
        expect(layers[0].opacity).toBe(1)
        expect(layers[0].visible).toBe(true)
    })
})
