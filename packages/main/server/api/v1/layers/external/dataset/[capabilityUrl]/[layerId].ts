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
    const requestUrl = getRequestURL(event)
    const selfUrl = `${requestUrl.origin}/api/v1/layers/external/dataset/${capabilityUrlParam}/${layerId}`
    const distributionsUrl = `${requestUrl.origin}/api/v1/layers/external/${capabilityUrlParam}/${layerId}`
    const hostname = new URL(capabilityUrl).hostname

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return {
        id: layerId,
        links: [
            {
                href: selfUrl,
                rel: 'self',
                title: 'This Record',
            },
            {
                href: distributionsUrl,
                rel: 'distributions',
                title: 'Distributions',
                type: 'application/json',
            },
        ],
        properties: {
            title: `${layerId} on ${hostname}`,
            type: 'Dataset',
        },
    }
})
