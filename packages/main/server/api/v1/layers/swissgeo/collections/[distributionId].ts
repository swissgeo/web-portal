import type { OGCRecords } from '@swissgeo/shared/ogc'

import fs from 'node:fs/promises'

import { prependLinks } from '../../_utils'

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
    const jsonData = JSON.parse(data.toString()) as OGCRecords

    const records = jsonData.records
    jsonData.records = prependLinks(records)

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return jsonData
})
