import type { Dataset } from '@swissgeo/ogc'

export type FileLayerType = 'geojson' | 'kml' | 'kmz' | 'gpx'
export type LayerType = 'dataset' | FileLayerType

export interface LayerAttribution {
    title: string
    url?: string
    logoUrl?: string
}

export interface LayerInfo {
    displayName: string
    abstract?: string
    attribution?: LayerAttribution
}

export interface Dimension {
    currentValue: string | null
    availableValues: string[]
}

/**
 * Keeping the time as a general Dimension. This should make future dimension implementation
 * possible. Still using the identifier 'time' somewhat hardcoded. This would of course mean we can
 * only have one time dimension, but this probably makes sense
 */
export type DimensionId = 'time'

export type DimensionRecord = Partial<Record<DimensionId, Dimension>>

export interface Layer {
    type: LayerType
    uuid: string
    humanId: string // something human readable. usually the layer ID. Not unique!
    isVisible: boolean
    opacity: number
    isLoading: boolean
    info?: LayerInfo
    // data is either the dataset or the file data, depending on whether
    // this is used a file layer or dataset layer
    data?: Dataset | string
    dimensions?: DimensionRecord
    // Url to the dataset or the file
    layerUrl?: string
}

// Type to narrow above type
export interface DatasetLayer extends Layer {
    type: 'dataset'
    data: Dataset
}

export * from './utils'
