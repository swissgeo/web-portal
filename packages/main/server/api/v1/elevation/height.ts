import { registerProj4 } from '@swissgeo/coordinates'
import log from '@swissgeo/log'
import { createError, getQuery } from 'h3'
import proj4 from 'proj4'

registerProj4(proj4)

const LV95_EPSG = 'EPSG:2056'
const WGS84_EPSG = 'EPSG:4326'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
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
        if (!config.geoadminApiBaseUrl) {
            throw new Error('Geoadmin API base URL is not configured')
        }
        const data = await $fetch<{ height: string }>(`${config.geoadminApiBaseUrl}/height`, {
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
