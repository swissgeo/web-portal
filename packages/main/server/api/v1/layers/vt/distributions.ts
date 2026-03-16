export default defineEventHandler((event) => {
    const distributions = {
        id: 'ch.swisstopo.vt',
        records: [
            {
                id: 'ch.swisstopo.vt',
                links: [
                    {
                        href: '/api/v1/layers/vt/style',
                        rel: 'styledby',
                    },
                    {
                        href: '/api/v1/layers/vt/tiles',
                        rel: 'data',
                    },
                ],
                properties: {
                    protocol: 'Vector',
                },
            },
        ],
    }

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return distributions
})
