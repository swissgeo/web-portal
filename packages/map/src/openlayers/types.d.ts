export interface WMSLayer {
    Name?: string
    Title?: string
    Abstract?: string
    Layer?: WMSLayer[] // For nested groups
    Dimension?: WMSDimension[]
}

export interface WMSDimension {
    name: string
    units: string
    unitSymbol?: string
    default?: string
    multipleValues?: boolean
    values?: string // This usually contains the time string "2023-01-01/2023-12-31/P1D"
}

export interface WMTSLayer {
    Identifier: string
    Title: string
    Abstract?: string
    TileMatrixSetLink: Array<{
        TileMatrixSet: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        TileMatrixLimits?: any[]
    }>
    Style: Array<{
        Identifier: string
        isDefault: boolean
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        LegendURL?: any[]
    }>
    Format: string[]
    Dimension?: WMTSDimension[]
    ResourceURL?: Array<{
        format: string
        resourceType: string
        template: string
    }>
}

export interface WMTSDimension {
    Identifier: string
    Default: string
    Value: string[]
}
