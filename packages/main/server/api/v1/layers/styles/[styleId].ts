import fs from 'node:fs/promises'

export default defineEventHandler(async (event) => {
    const param = getRouterParam(event, 'styleId')

    if (!param) {
        throw createError({
            status: 404,
            statusMessage: 'Not Found',
            message: 'Layer with this ID not Found',
        })
    }

    const styleId = decodeURIComponent(param)

    // path is relative to the package
    const path = `../../ogc-records/styles/${styleId}`
    const data = await fs.readFile(path)

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return data
})
