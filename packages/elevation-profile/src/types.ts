export interface ElevationProfilePoint {
    dist: number
    coordinate: [number, number]
    elevation?: number
    hasElevationData: boolean
}

export interface ElevationProfileMetadata {
    totalLinearDist: number
    minElevation: number
    maxElevation: number
    elevationDifference: number
    totalAscent: number
    totalDescent: number
    slopeDistance: number
    hasElevationData: boolean
    hasDistanceData: boolean
}

export interface ElevationProfileResponse {
    points: ElevationProfilePoint[]
    metadata: ElevationProfileMetadata
}
