import { describe, expect, it, vi } from 'vitest'

const routerParams: Record<string, string | undefined> = {}
let requestUrl = new URL('http://localhost:3000/api/v1/layers/external/dataset/x/y')

;(globalThis as Record<string, unknown>).defineEventHandler = (fn: (_event: unknown) => unknown) =>
    fn

vi.mock('h3', () => ({
    getRouterParam: (_event: unknown, name: string) => routerParams[name],
    getRequestURL: () => requestUrl,
    appendResponseHeader: vi.fn(),
    createError: (opts: { status: number; statusMessage?: string; message?: string }) => {
        const err = new Error(opts.message ?? opts.statusMessage ?? 'error') as Error & {
            status?: number
        }
        err.status = opts.status
        return err
    },
}))

const handler = (await import('../[layerId]')).default as (_event: unknown) => unknown

interface DatasetResponse {
    id: string
    links: { href: string; rel: string; title?: string; type?: string }[]
    properties: { title: string; type: string }
}

describe('GET /api/v1/layers/external/dataset/[capabilityUrl]/[layerId]', () => {
    it('returns a dataset with self and distributions links', () => {
        const capabilityUrl = 'https://wms.example.com/?SERVICE=WMS'
        const encoded = encodeURIComponent(capabilityUrl)
        routerParams.capabilityUrl = encoded
        routerParams.layerId = 'my-layer'
        requestUrl = new URL(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/my-layer`
        )

        const result = handler({}) as DatasetResponse

        expect(result.id).toBe('my-layer')
        expect(result.properties).toEqual({
            title: 'my-layer on wms.example.com',
            type: 'Dataset',
        })

        const selfLink = result.links.find((l) => l.rel === 'self')
        expect(selfLink).toBeDefined()
        expect(selfLink?.href).toBe(
            `http://localhost:3000/api/v1/layers/external/dataset/${encoded}/my-layer`
        )

        const distributionsLink = result.links.find((l) => l.rel === 'distributions')
        expect(distributionsLink?.href).toBe(
            `http://localhost:3000/api/v1/layers/external/${encoded}/my-layer`
        )
        expect(distributionsLink?.type).toBe('application/json')
    })

    it('throws a 400 when capabilityUrl is missing', () => {
        routerParams.capabilityUrl = undefined
        routerParams.layerId = 'my-layer'

        expect(() => handler({})).toThrow()
    })

    it('throws a 400 when layerId is missing', () => {
        routerParams.capabilityUrl = 'whatever'
        routerParams.layerId = undefined

        expect(() => handler({})).toThrow()
    })
})
