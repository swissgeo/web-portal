import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const routerParams: Record<string, string | undefined> = {}
let requestUrl = new URL('http://localhost:3000/api/v1/layers/external/dataset/x/y')
let query: Record<string, string | undefined> = {}

;(globalThis as Record<string, unknown>).defineEventHandler = (
    fn: (_event: unknown) => unknown
) => fn

vi.mock('h3', () => ({
    getRouterParam: (_event: unknown, name: string) => routerParams[name],
    getRequestURL: () => requestUrl,
    getQuery: () => query,
    appendResponseHeader: vi.fn(),
    createError: (opts: { status: number; statusMessage?: string; message?: string }) => {
        const err = new Error(opts.message ?? opts.statusMessage ?? 'error') as Error & {
            status?: number
        }
        err.status = opts.status
        return err
    },
}))

const handler = (await import('../[layerId]')).default as (_event: unknown) => Promise<unknown>

interface DatasetResponse {
    id: string
    links: { href: string; rel: string; title?: string; type?: string }[]
    properties: { title: string; type: string }
}

function mockFetchOnce(body: string, ok = true) {
    const fetchMock = vi.fn().mockResolvedValue({
        ok,
        text: () => Promise.resolve(body),
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

beforeEach(() => {
    routerParams.capabilityUrl = undefined
    routerParams.layerId = undefined
    query = {}
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('GET /api/v1/layers/external/dataset/[capabilityUrl]/[layerId]', () => {
    it('extracts the title from a WMTS capabilities document', async () => {
        const capabilityUrl = 'https://wmts.example.com/1.0.0/WMTSCapabilities.xml'
        const encoded = encodeURIComponent(capabilityUrl)
        routerParams.capabilityUrl = encoded
        routerParams.layerId = 'my-layer'
        requestUrl = new URL(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/my-layer`
        )

        mockFetchOnce(`<?xml version="1.0" encoding="UTF-8"?>
            <Capabilities xmlns="http://www.opengis.net/wmts/1.0"
                          xmlns:ows="http://www.opengis.net/ows/1.1">
                <Contents>
                    <Layer>
                        <ows:Title>Other Title</ows:Title>
                        <ows:Identifier>other-layer</ows:Identifier>
                    </Layer>
                    <Layer>
                        <ows:Title>My Real Title</ows:Title>
                        <ows:Identifier>my-layer</ows:Identifier>
                    </Layer>
                </Contents>
            </Capabilities>`)

        const result = (await handler({})) as DatasetResponse

        expect(result.id).toBe('my-layer')
        expect(result.properties.title).toBe('My Real Title')
    })

    it('extracts the title from a WMS capabilities document', async () => {
        const capabilityUrl = 'https://wms.example.com/?SERVICE=WMS'
        const encoded = encodeURIComponent(capabilityUrl)
        routerParams.capabilityUrl = encoded
        routerParams.layerId = 'my-layer'
        requestUrl = new URL(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/my-layer`
        )

        mockFetchOnce(`<?xml version="1.0"?>
            <WMS_Capabilities xmlns="http://www.opengis.net/wms">
                <Capability>
                    <Layer>
                        <Layer>
                            <Name>my-layer</Name>
                            <Title>WMS Real Title</Title>
                        </Layer>
                    </Layer>
                </Capability>
            </WMS_Capabilities>`)

        const result = (await handler({})) as DatasetResponse

        expect(result.properties.title).toBe('WMS Real Title')
    })

    it('falls back to a synthetic title when the capabilities fetch fails', async () => {
        const capabilityUrl = 'https://wms.example.com/?SERVICE=WMS'
        const encoded = encodeURIComponent(capabilityUrl)
        routerParams.capabilityUrl = encoded
        routerParams.layerId = 'my-layer'
        requestUrl = new URL(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/my-layer`
        )

        vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValue(new Error('network down'))
        )

        const result = (await handler({})) as DatasetResponse

        expect(result.properties.title).toBe('my-layer on wms.example.com')
    })

    it('falls back to a synthetic title when the layer is not found in capabilities', async () => {
        const capabilityUrl = 'https://wmts.example.com/1.0.0/WMTSCapabilities.xml'
        const encoded = encodeURIComponent(capabilityUrl)
        routerParams.capabilityUrl = encoded
        routerParams.layerId = 'missing-layer'
        requestUrl = new URL(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/missing-layer`
        )

        mockFetchOnce(`<?xml version="1.0" encoding="UTF-8"?>
            <Capabilities xmlns="http://www.opengis.net/wmts/1.0"
                          xmlns:ows="http://www.opengis.net/ows/1.1">
                <Contents>
                    <Layer>
                        <ows:Title>Other Title</ows:Title>
                        <ows:Identifier>other-layer</ows:Identifier>
                    </Layer>
                </Contents>
            </Capabilities>`)

        const result = (await handler({})) as DatasetResponse

        expect(result.properties.title).toBe('missing-layer on wmts.example.com')
    })

    it('returns the correct self and distributions links', async () => {
        const capabilityUrl = 'https://wms.example.com/?SERVICE=WMS'
        const encoded = encodeURIComponent(capabilityUrl)
        routerParams.capabilityUrl = encoded
        routerParams.layerId = 'my-layer'
        requestUrl = new URL(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/my-layer`
        )

        vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValue(new Error('skip parsing'))
        )

        const result = (await handler({})) as DatasetResponse

        const selfLink = result.links.find((l) => l.rel === 'self')
        expect(selfLink?.href).toBe(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/my-layer`
        )

        const distributionsLink = result.links.find((l) => l.rel === 'distributions')
        expect(distributionsLink?.href).toBe(
            `http://localhost:3000/api/v1/layers/external/${encoded}/my-layer`
        )
        expect(distributionsLink?.type).toBe('application/json')
    })

    it('forwards the language query param to the capabilities fetch', async () => {
        const capabilityUrl = 'https://wmts.example.com/1.0.0/WMTSCapabilities.xml'
        const encoded = encodeURIComponent(capabilityUrl)
        routerParams.capabilityUrl = encoded
        routerParams.layerId = 'my-layer'
        query = { language: 'fr' }
        requestUrl = new URL(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/my-layer?language=fr`
        )

        const fetchMock = mockFetchOnce(`<?xml version="1.0" encoding="UTF-8"?>
            <Capabilities xmlns="http://www.opengis.net/wmts/1.0"
                          xmlns:ows="http://www.opengis.net/ows/1.1">
                <Contents>
                    <Layer>
                        <ows:Title>Titre Français</ows:Title>
                        <ows:Identifier>my-layer</ows:Identifier>
                    </Layer>
                </Contents>
            </Capabilities>`)

        const result = (await handler({})) as DatasetResponse

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const fetchedUrl = new URL(fetchMock.mock.calls[0][0] as string)
        expect(fetchedUrl.searchParams.get('language')).toBe('fr')
        expect(result.properties.title).toBe('Titre Français')
    })

    it('appends language without clobbering existing query params on the capabilities URL', async () => {
        const capabilityUrl = 'https://wms.example.com/?SERVICE=WMS&REQUEST=GetCapabilities'
        const encoded = encodeURIComponent(capabilityUrl)
        routerParams.capabilityUrl = encoded
        routerParams.layerId = 'my-layer'
        query = { language: 'de' }
        requestUrl = new URL(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/my-layer?language=de`
        )

        const fetchMock = mockFetchOnce(`<?xml version="1.0"?>
            <WMS_Capabilities xmlns="http://www.opengis.net/wms">
                <Capability>
                    <Layer>
                        <Layer>
                            <Name>my-layer</Name>
                            <Title>Deutscher Titel</Title>
                        </Layer>
                    </Layer>
                </Capability>
            </WMS_Capabilities>`)

        await handler({})

        const fetchedUrl = new URL(fetchMock.mock.calls[0][0] as string)
        expect(fetchedUrl.searchParams.get('SERVICE')).toBe('WMS')
        expect(fetchedUrl.searchParams.get('REQUEST')).toBe('GetCapabilities')
        expect(fetchedUrl.searchParams.get('language')).toBe('de')
    })

    it('throws a 400 when capabilityUrl is missing', async () => {
        routerParams.capabilityUrl = undefined
        routerParams.layerId = 'my-layer'

        await expect(Promise.resolve(handler({}))).rejects.toThrow()
    })

    it('throws a 400 when layerId is missing', async () => {
        routerParams.capabilityUrl = 'whatever'
        routerParams.layerId = undefined

        await expect(Promise.resolve(handler({}))).rejects.toThrow()
    })
})
