import type { ElevationProfile } from '@swissgeo/shared/types/api'
import type { LineString } from 'geojson'

import log from '@swissgeo/log'
import { createError } from 'h3'

function isValidLineString(body: unknown): body is LineString {
    if (!body || typeof body !== 'object') {
        return false
    }
    const b = body as Record<string, unknown>
    return (
        b['type'] === 'LineString' &&
        Array.isArray(b['coordinates']) &&
        (b['coordinates'] as unknown[]).every(
            (coord) =>
                Array.isArray(coord) &&
                coord.length === 2 &&
                typeof coord[0] === 'number' &&
                typeof coord[1] === 'number' &&
                !isNaN(coord[0]) &&
                !isNaN(coord[1])
        )
    )
}

const ELEVATION_PROFILE_API_BASE_URL = 'https://api3.geo.admin.ch/rest/services/profile.json'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!isValidLineString(body)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid request body: expected a GeoJSON LineString with coordinates',
        })
    }

    log.info(`Received elevation profile request with ${body.coordinates.length} points`)

    try {
        return await $fetch<ElevationProfile>(ELEVATION_PROFILE_API_BASE_URL, {
            method: 'POST',
            query: { offset: 0, sr: 2056, distinct_points: true },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ geom: JSON.stringify(body) }).toString(),
        })
    } catch (error) {
        log.error(`Elevation profile upstream error: ${String(error)}`)
        throw createError({
            statusCode: 500,
            statusMessage: 'Error fetching elevation profile data',
        })
    }
})
