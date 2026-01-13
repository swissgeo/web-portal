import type { Dataset } from '@swissgeo/shared/ogc'

import { v4 as uuidv4 } from 'uuid'

import { useLayerStore } from '@/stores/layer'

export enum LayerType {
    WMTS = 'wmts',
    WMS = 'wms',
    GEOJSON = 'geojson',
    VECTOR = 'vector',
}

export interface LayerAttribution {
    title: string
    url: string
    logoUrl: string
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

// File layer fills properties for file location or so
export interface FileLayer extends Layer {}

// Server layer fills properties like the Dataset
export const makeServerLayer = (
    type: LayerType,
    dataset: Dataset,
    options?: Partial<Layer>
): Layer => {
    const layerStore = useLayerStore()

    return {
        uuid: uuidv4(),
        humanId: dataset.id,
        opacity: 1,
        dataset,
        isVisible: true,
        type,
        isLoading: false,
        zIndex: layerStore.greatestZIndex + 1,
        info: null, // to be set later
        ...options,
    }
}

export { useLayerStore } from '@/stores/layer'

export * from './geoJsonStyle'

export * from './utils'
