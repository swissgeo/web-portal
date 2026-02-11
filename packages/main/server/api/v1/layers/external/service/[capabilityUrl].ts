export default defineEventHandler((event) => {
    const capabilityUrlParam = getRouterParam(event, 'capabilityUrl')

    if (!capabilityUrlParam) {
        throw createError({
            status: 400,
            statusMessage: 'Bad Request',
            message: 'Capability URL cannot be determined',
        })
    }

    const capabilityUrl = decodeURIComponent(capabilityUrlParam)

    // Determine the appropriate proxy endpoint based on the capability URL
    let proxyEndpoint = '/api/v1/layers/wmtsConfig/'
    if (capabilityUrl.toLowerCase().includes('wms')) {
        proxyEndpoint = '/api/v1/layers/wmsConfig/'
    }

    // Construct the proxy URL that will fetch and parse the capabilities
    const proxyUrl = `${proxyEndpoint}${capabilityUrlParam}`

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return {
        id: capabilityUrl,
        links: [
            {
                href: proxyUrl,
                rel: 'about',
                type: 'application/json',
                title: 'Capability',
            },
        ],
    }
})
