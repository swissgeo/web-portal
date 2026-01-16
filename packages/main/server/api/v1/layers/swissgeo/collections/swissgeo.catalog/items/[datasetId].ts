import type { OGCRecords } from '@swissgeo/shared/ogc'

import fs from 'node:fs/promises'

export default defineEventHandler(async (event) => {
    const param = getRouterParam(event, 'datasetId')

    if (!param) {
        throw createError({
            status: 404,
            statusMessage: 'Not Found',
            message: 'Layer with this ID not Found',
        })
    }

    const datasetId = decodeURIComponent(param)

    // path is relative to the package
    const path = `../../ogc-records/swissgeo.catalog`
    const data = await fs.readFile(path)

    // getting the entire catalog. Now we can extract the particular layerId and return *that*

    const jsonData = JSON.parse(data.toString()) as OGCRecords
    const features = jsonData.features

    const feature = features.find((feature) => feature.id === datasetId)

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return feature
})
