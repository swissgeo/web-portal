import type { Page, Route } from '@playwright/test'

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

test.describe('print page', () => {
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
            (route: Route) =>
                route.fulfill({
                    status: 200,
                    json: ChSwisstopoPixelkarteFarbeDistribution,
                })
        )

        // we let all the backgrounds to return the data for pixelkarte-farbe
        await page.route('http://mock-oar.org/api/oar/items/ch.swisstopo.*', mockBackgroundResponse)

        await page.route('https://wmts.geo.admin.ch/**/WMTSCapabilities.xml', (route: Route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/xml',
                body: WMTSCapabilities,
            })
        )

        // mock the tiles
        await page.route('https://wmts.geo.admin.ch/1.0.0/**.jpeg', (route: Route) =>
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
        // if we lack print format, print orientation, zoom --> 500 error
        // if we lack print resolution --> garbage (should also be 500 error)
        await page.goto('/de/print?print_format=a4&print_orientation=landscape&z=7&print_resolution=96')
        await expect(page.getByTestId('ol-map')).toBeVisible({
            timeout: HYDRATION_TIMEOUT,
        })
    })

    test.afterEach(async ({ page }) => {
        await cleanupExternalRequestMocks(page)
    })

    test('The Toolbox should not be visible', async ( {page}) => {
        await expect(page.getByTestId('toolbox-right')).not.toBeVisible()
    })

    test('Shows the North Arrow', async ({ page }) => {
        await expect(page.getByTestId("print-north-arrow")).toBeVisible()
    })

    test('Does not show the sharelink and QRCode if a sharestate does not exist', async ({page}) => {
        await expect(page.getByTestId("print-sharelink")).not.toBeVisible()
        await expect(page.getByTestId("print-qrcode")).not.toBeVisible()
    })

    test('Shows the sharelink and QRCode if a sharestate exists', async ({page}) => {
        // as long as there is a stateid, there will be a shortlink and a QRCode to reach such state.
        await page.goto('/de/print?print_format=a4&print_orientation=landscape&z=7&print_resolution=96&stateid=8976')
        await expect(page.getByTestId("print-sharelink")).not.toBeVisible()
        await expect(page.getByTestId("print-qrcode")).not.toBeVisible()
    })

    test('Shows the disclaimer', async({page}) => {
        await expect(page.getByTestId("print-disclaimer")).toBeVisible()
    })

    // Errors: those have wrong parameters, so we should not see the map in those cases.
    // Error handling tests are unit tests :3
    test('Does not show the map when there is no format defined', async ({page}) => {
        await page.goto('/de/print?print_orientation=landscape&z=7&print_resolution=96&stateid=8976')
        await expect(page.getByTestId('ol-map')).not.toBeVisible()
    })
    test('Does not show the map when there is no orientation defined', async ({page}) => {
        await page.goto('/de/print?print_format=a4&z=7&print_resolution=96&stateid=8976')
        await expect(page.getByTestId('ol-map')).not.toBeVisible()

    })
    test('Does not show the map when there is no resolution defined', async ({page}) => {
        await page.goto('/de/print?print_orientation=landscape&z=7&print_format=a4&stateid=8976')
        await expect(page.getByTestId('ol-map')).not.toBeVisible()
    })
    test('Does not show the map when there is no zoom defined', async ({page}) => {
        await page.goto('/de/print?print_orientation=landscape&print_format=a4&print_resolution=96&stateid=8976')
        await expect(page.getByTestId('ol-map')).not.toBeVisible()
    })
    test('Does not show the map when there is an invalid value for the format', async ({page}) => {
        await page.goto('/de/print?print_format=a78&print_orientation=landscape&z=7&print_resolution=96')
        await expect(page.getByTestId('ol-map')).not.toBeVisible()

    })
    test('Does not show the map when there is an invalid value for the orientation', async ({page}) => {
        await page.goto('/de/print?print_format=a4&print_orientation=falsy&z=7&print_resolution=96')
        await expect(page.getByTestId('ol-map')).not.toBeVisible()

    })
    test('Does not show the map when there is an invalid value for the zoom', async ({page}) => {
        await page.goto('/de/print?print_format=a4&print_orientation=landscape&z=-3&print_resolution=96')
        await expect(page.getByTestId('ol-map')).not.toBeVisible()

    })
    test('Does not show the map when there is an invalid value for the resolution', async ({page}) => {
        await page.goto('/de/print?print_format=a4&print_orientation=landscape&z=7&print_resolution=anvil')
        await expect(page.getByTestId('ol-map')).not.toBeVisible()

    })


})
