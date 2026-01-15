import fs from 'node:fs/promises'

export default defineEventHandler(async (event) => {
    const param = getRouterParam(event, 'distributionId')

    if (!param) {
        throw createError({
            status: 404,
            statusMessage: 'Not Found',
            message: 'Layer with this ID not Found',
        })
    }

    const distributionId = decodeURIComponent(param)

    // path is relative to the package
    const path = `../../ogc-records/collections/${distributionId}`
    const data = await fs.readFile(path)

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return data
})
