import type {
    ElevationProfileMetadata,
    ElevationProfilePoint,
    ElevationProfileResponse,
} from '@swissgeo/elevation-profile'
import type { LineString, Position } from 'geojson'

import { LV95, registerProj4 } from '@swissgeo/coordinates'
import log from '@swissgeo/log'
import { createError } from 'h3'
import proj4 from 'proj4'

registerProj4(proj4)

interface RawProfilePoint {
    alts?: { COMB?: number; DTM2?: number; DTM25?: number }
    dist: number
    easting: number
    northing: number
}

const MAX_POINTS_PER_CHUNK = 3000

function isValidLineString(body: unknown): body is { geojson: LineString; sr?: number } {
    if (!body || typeof body !== 'object') {
        return false
    }
    const b = body as Record<string, unknown>
    const geojson = b['geojson']
    if (!geojson || typeof geojson !== 'object') {
        return false
    }
    const g = geojson as Record<string, unknown>
    return (
        g['type'] === 'LineString' &&
        Array.isArray(g['coordinates']) &&
        (g['coordinates'] as unknown[]).every(
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

function reprojectCoordinatesToLV95(coordinates: Position[], srEpsg: string): Position[] {
    if (srEpsg === LV95.epsg) {
        return coordinates
    }
    return coordinates.map((coord) => proj4(srEpsg, LV95.epsg, coord))
}

function chunkCoordinates(coordinates: Position[]): Position[][] {
    const chunks: Position[][] = []
    for (let i = 0; i < coordinates.length; i += MAX_POINTS_PER_CHUNK) {
        chunks.push(coordinates.slice(i, i + MAX_POINTS_PER_CHUNK))
    }
    return chunks
}

async function fetchProfileChunk(coordinates: Position[]): Promise<RawProfilePoint[]> {
    const config = useRuntimeConfig()
    return $fetch<RawProfilePoint[]>(`${config.geoadminApiBaseUrl}/profile.json`, {
        method: 'POST',
        query: { offset: 0, sr: 2056, distinct_points: true },
        body: { type: 'LineString', coordinates },
    })
}

function toEnrichedPoint(raw: RawProfilePoint, distOffset: number): ElevationProfilePoint {
    const elevation = raw.alts?.COMB
    return {
        dist: raw.dist + distOffset,
        coordinate: [raw.easting, raw.northing],
        elevation,
        hasElevationData: elevation !== undefined,
    }
}

function computeMetadata(points: ElevationProfilePoint[]): ElevationProfileMetadata {
    const hasElevationData = points.some((p) => p.hasElevationData)
    const hasDistanceData = points.some((p) => p.dist > 0)

    if (!hasElevationData) {
        return {
            totalLinearDist: points.at(-1)?.dist ?? 0,
            minElevation: 0,
            maxElevation: 0,
            elevationDifference: 0,
            totalAscent: 0,
            totalDescent: 0,
            slopeDistance: 0,
            hasElevationData,
            hasDistanceData,
        }
    }

    const elevations = points.map((p) => p.elevation ?? 0)
    const minElevation = Math.min(...elevations)
    const maxElevation = Math.max(...elevations)
    const elevationDifference = (points.at(-1)?.elevation ?? 0) - (points[0]?.elevation ?? 0)

    let totalAscent = 0
    let totalDescent = 0
    let slopeDistance = 0

    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]!
        const curr = points[i]!
        const elevDelta = (curr.elevation ?? 0) - (prev.elevation ?? 0)
        const distDelta = curr.dist - prev.dist

        if (elevDelta > 0) {
            totalAscent += elevDelta
        } else {
            totalDescent += Math.abs(elevDelta)
        }

        slopeDistance += Math.sqrt(Math.pow(elevDelta, 2) + Math.pow(distDelta, 2))
    }

    return {
        totalLinearDist: points.at(-1)?.dist ?? 0,
        minElevation,
        maxElevation,
        elevationDifference,
        totalAscent,
        totalDescent,
        slopeDistance,
        hasElevationData,
        hasDistanceData,
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!isValidLineString(body)) {
        throw createError({
            statusCode: 400,
            statusMessage:
                'Invalid request body: expected { geojson: GeoJSON LineString, sr?: number }',
        })
    }

    const srEpsg = body.sr ? `EPSG:${body.sr}` : LV95.epsg
    const lv95Coordinates = reprojectCoordinatesToLV95(body.geojson.coordinates, srEpsg)

    log.info(
        `Received elevation profile request with ${lv95Coordinates.length} points (input sr: ${srEpsg})`
    )

    const chunks = chunkCoordinates(lv95Coordinates)

    try {
        const responses = await Promise.all(chunks.map(fetchProfileChunk))

        let distOffset = 0
        const points: ElevationProfilePoint[] = []

        for (const response of responses) {
            for (const raw of response) {
                points.push(toEnrichedPoint(raw, distOffset))
            }
            distOffset = points.at(-1)?.dist ?? distOffset
        }

        return {
            points,
            metadata: computeMetadata(points),
        } satisfies ElevationProfileResponse
    } catch (error) {
        log.error(`Elevation profile upstream error: ${String(error)}`)
        throw createError({
            statusCode: 500,
            statusMessage: 'Error fetching elevation profile data',
        })
    }
})
