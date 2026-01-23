import type { Dataset } from '@swissgeo/shared/ogc'

export enum LayerType {
    WMTS = 'wmts',
    WMS = 'wms',
    GEOJSON = 'geojson',
    VECTOR = 'vector',
}

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
}

export interface DatasetLayer extends Layer {
    dataset: Dataset
}

// File layer fills properties for file location or so
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FileLayer extends Layer {}

export { useLayerStore } from '@/stores/layer'

export * from './geoJsonStyle'

export * from './utils'
