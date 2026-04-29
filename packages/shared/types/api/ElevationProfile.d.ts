export interface ElevationProfilePoint {
    alts: {
        COMB: number
        DTM2: number
        DTM25: number
    }
    dist: number
    easting: number
    northing: number
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

export type ElevationProfile = ElevationProfilePoint[]
