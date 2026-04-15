import log from '@swissgeo/log'
import { createError, getQuery } from 'h3'

const ELEVATION_API_BASE_URL = 'https://api3.geo.admin.ch/rest/services'

export default defineEventHandler(async (event) => {
    const { easting, northing } = getQuery(event)

    if (!easting || !northing || typeof easting !== 'string' || typeof northing !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required query parameters: easting, northing',
        })
    }

    const eastingNum = parseFloat(easting)
    const northingNum = parseFloat(northing)
    if (isNaN(eastingNum) || isNaN(northingNum)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'easting and northing must be numeric',
        })
    }

    try {
        const data = await $fetch<{ height: string }>(`${ELEVATION_API_BASE_URL}/height`, {
            query: { easting: eastingNum, northing: northingNum },
        })

        return { height: data.height }
    } catch (error) {
        log.error(
            `Elevation upstream error for easting=${eastingNum}, northing=${northingNum}: ${String(error)}`
        )
        throw createError({
            statusCode: 500,
            statusMessage: 'Error fetching elevation data',
        })
    }
})
