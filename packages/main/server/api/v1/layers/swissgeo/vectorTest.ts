import fs from 'node:fs/promises'

export default defineEventHandler(async (event) => {
    // path is relative to the package
    const path = `../../ogc-records/OSM-Bright-LV95.json`
    const data = await fs.readFile(path)

    appendResponseHeader(event, 'Content-Type', 'application/json')
    appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
    return data
})
