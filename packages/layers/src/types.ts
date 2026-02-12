import type { Dataset, GeoJSON } from '@swissgeo/ogc'

export type LayerType = 'wmts' | 'wms' | 'geojson' | 'vector' | 'kml' | 'kmz' | 'gpx'

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

export interface Layer {
    uuid: string
    humanId: string // something human readable. usually the layer ID. Not unique!
    isVisible: boolean
    type: LayerType
    opacity: number
    isLoading: boolean
    zIndex: number
    info?: LayerInfo | null
    dataset?: Dataset
    dimensions?: Partial<Record<DimensionId, Dimension>>
}

export interface DatasetLayer extends Layer {
    dataset: Dataset
}

// File layer fills properties for file location or so
export interface FileLayer extends Layer {
    fileData?: string // Raw file content for KML/KMZ/GPX files
    geoJsonData?: GeoJSON // Parsed GeoJSON data (for backward compatibility)
}

export { useLayerStore } from '@/stores/layer'

export * from './utils'
