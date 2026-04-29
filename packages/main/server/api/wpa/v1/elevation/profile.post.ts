import type { ElevationProfile, ElevationProfilePoint } from '@swissgeo/shared/api'
import type { LineString, Position } from 'geojson'

import log from '@swissgeo/log'
import { createError } from 'h3'

const ELEVATION_PROFILE_API_BASE_URL = 'https://api3.geo.admin.ch/rest/services/profile.json'
const MAX_POINTS_PER_CHUNK = 3000

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

function chunkCoordinates(coordinates: Position[]): Position[][] {
    const chunks: Position[][] = []
    for (let i = 0; i < coordinates.length; i += MAX_POINTS_PER_CHUNK) {
        chunks.push(coordinates.slice(i, i + MAX_POINTS_PER_CHUNK))
    }
    return chunks
}

async function fetchProfileChunk(coordinates: Position[]): Promise<ElevationProfile> {
    return $fetch<ElevationProfile>(ELEVATION_PROFILE_API_BASE_URL, {
        method: 'POST',
        query: { offset: 0, sr: 2056, distinct_points: true },
        body: { type: 'LineString', coordinates },
    })
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!isValidLineString(body)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid request body: expected a GeoJSON LineString with coordinates',
        })
    }

    log.info(`Received elevation profile request with ${body.coordinates.length} points`)

    const chunks = chunkCoordinates(body.coordinates)

    try {
        const responses = await Promise.all(chunks.map(fetchProfileChunk))

        let distOffset = 0
        const result: ElevationProfile = []

        for (const response of responses) {
            for (const point of response) {
                result.push({ ...point, dist: point.dist + distOffset } as ElevationProfilePoint)
            }
            distOffset = result[result.length - 1]?.dist ?? distOffset
        }

        return result
    } catch (error) {
        log.error(`Elevation profile upstream error: ${String(error)}`)
        throw createError({
            statusCode: 500,
            statusMessage: 'Error fetching elevation profile data',
        })
    }
})
