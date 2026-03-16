import type { Dataset } from '@swissgeo/ogc'
import type GeoJSON from 'ol/format/GeoJSON'

export type FileLayerType = 'geojson' | 'kml' | 'kmz' | 'gpx'

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

// adding vector here as a special case. It's actually probably a dataset, but
// until we have this implemented correctly, using this type
export type LayerType = 'dataset' | 'kml' | 'kmz' | 'gpx' | 'geojson' | 'vector'

export interface Layer {
    uuid: string
    humanId: string // something human readable. usually the layer ID. Not unique!
    isVisible: boolean
    opacity: number
    isLoading: boolean
    info?: LayerInfo | null
    dataset?: Dataset
    dimensions?: DimensionRecord
}

export interface DatasetLayer extends Layer {
    dataset: Dataset
}

// File layer fills properties for file location or so
export interface FileLayer extends Layer {
    type: FileLayerType
    fileData?: string // Raw file content for KML/KMZ/GPX files
    geoJsonData?: GeoJSON // Parsed GeoJSON data (for backward compatibility)
}

export * from './utils'
