export default defineEventHandler(async (event) => {
    const param = getRouterParam(event, 'geoJsonUrl')
    if (!param) {
        throw createError({
            status: 400,
            statusMessage: 'Bad Request',
            message: 'Geo JSON URL cannot be determined',
        })
    }

    const geoJsonUrl = decodeURIComponent(param)

    const geoJsonData = await $fetch<string>(geoJsonUrl)

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return geoJsonData
})
