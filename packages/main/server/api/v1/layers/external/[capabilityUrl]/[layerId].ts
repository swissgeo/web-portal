import { Protocol } from '@swissgeo/shared/ogc'

const basePath = 'http://localhost:3000/api/v1/layers/external/'

export default defineEventHandler((event) => {
    const capabilityUrlParam = getRouterParam(event, 'capabilityUrl')
    const layerId = getRouterParam(event, 'layerId')

    const serviceUrl = basePath + `service/${capabilityUrlParam}`

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return {
        records: [
            {
                id: `${layerId}`,
                links: [
                    {
                        href: serviceUrl,
                        rel: 'service',
                    },
                ],
                properties: {
                    protocol: Protocol.wmts,
                    externalIds: [layerId],
                    type: 'Distribution',
                },
            },
        ],
    }
})
