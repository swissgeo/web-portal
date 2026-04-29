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

export type ElevationProfile = ElevationProfilePoint[]
