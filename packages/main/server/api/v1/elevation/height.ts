import { registerProj4 } from '@swissgeo/coordinates'
import log from '@swissgeo/log'
import { createError, getQuery } from 'h3'
import proj4 from 'proj4'

registerProj4(proj4)

const ELEVATION_API_BASE_URL = 'https://api3.geo.admin.ch/rest/services'
const LV95_EPSG = 'EPSG:2056'
const WGS84_EPSG = 'EPSG:4326'

export default defineEventHandler(async (event) => {
    const { lat, lon } = getQuery(event)

    if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required query parameters: lat, lon',
        })
    }

    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)
    if (isNaN(latNum) || isNaN(lonNum)) {
        throw createError({ statusCode: 400, statusMessage: 'lat and lon must be numeric' })
    }

    const [easting, northing] = proj4(WGS84_EPSG, LV95_EPSG, [lonNum, latNum])

    try {
        const data = await $fetch<{ height: string }>(`${ELEVATION_API_BASE_URL}/height`, {
            query: { easting, northing },
        })

        return { height: data.height }
    } catch (error) {
        log.error(`Elevation upstream error for lat=${latNum}, lon=${lonNum}: ${String(error)}`)
        throw createError({
            statusCode: 500,
            statusMessage: 'Error fetching elevation data',
        })
    }
})
