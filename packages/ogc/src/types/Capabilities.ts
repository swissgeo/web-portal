/**
 * Expose some common types so that not all the packages need to install the openlayers package as
 * dependency
 */

export interface WMSCapabilityLayer {
    Name?: string
    Title?: string
    Abstract?: string
    Layer?: WMSCapabilityLayer[] // For nested groups
    Dimension?: WMSCapabilityDimension[]
}

export interface WMSCapabilityDimension {
    name: string
    units: string
    unitSymbol?: string
    default?: string
    multipleValues?: boolean
    values?: string // This usually contains the time string "2023-01-01/2023-12-31/P1D"
}

export interface WMTSCapabilityLayer {
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
    Dimension?: WMTSCapabilityDimension[]
    ResourceURL?: Array<{
        format: string
        resourceType: string
        template: string
    }>
}

export interface WMTSCapabilityDimension {
    Identifier: string
    Default: string
    Value: string[]
}
