// Dev-mode Vite cold starts can take a while to hydrate the ClientOnly map
// content; prod preview is much faster. The guard here covers both.
export const HYDRATION_TIMEOUT = 60_000

/**
 * Mock external API requests so integration tests don't depend on real
 * services. Internal Nuxt server routes (/api/v1/*) call external backends
 * server-side, so we only need to intercept client-side requests that
 * leave the browser (e.g. OGC catalog, tile/style JSON, MapTiler).
 */
export async function mockExternalRequests(page: import('@playwright/test').Page) {
    // OGC catalog / dataset requests
    await page.route('**/api/oar/**', (route) =>
        route.fulfill({ status: 200, json: { collections: [], links: [] } })
    )
}
