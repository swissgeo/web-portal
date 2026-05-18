import { appendResponseHeader, createError, getRouterParam, getRequestURL } from 'h3'

export default defineEventHandler((event) => {
    const capabilityUrlParam = getRouterParam(event, 'capabilityUrl')
    const layerId = getRouterParam(event, 'layerId')

    if (!capabilityUrlParam || !layerId) {
        throw createError({
            status: 400,
            statusMessage: 'Bad Request',
            message: 'Capability URL and Layer ID are required',
        })
    }

    const capabilityUrl = decodeURIComponent(capabilityUrlParam)

    // Derive base URL from the incoming request so it works on any host/port
    const requestUrl = getRequestURL(event)
    const serviceUrl = `${requestUrl.origin}/api/wpa/v1/layers/external/service/${capabilityUrlParam}`

    // Determine protocol based on the capability URL
    let protocol = 'OGC:WMTS'
    if (capabilityUrl.toLowerCase().includes('wms')) {
        protocol = 'OGC:WMS'
    }

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return {
        id: layerId,
        type: 'Collection',
        itemType: 'Distribution',
        title: layerId,
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
                    protocol,
                    externalIds: [layerId],
                    type: 'Distribution',
                },
            },
        ],
    }
})
