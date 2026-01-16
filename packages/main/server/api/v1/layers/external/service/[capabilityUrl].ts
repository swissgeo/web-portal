export default defineEventHandler((event) => {
    const capabilityUrlParam = getRouterParam(event, 'capabilityUrl')

    const capabilityUrl = decodeURIComponent(capabilityUrlParam)

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return {
        id: capabilityUrl,
        links: [
            {
                href: capabilityUrl,
                rel: 'about',
                type: 'application/xml',
                title: 'Capability',
            },
        ],
    }
})
