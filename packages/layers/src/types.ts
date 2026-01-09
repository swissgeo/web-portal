import type { Feature as OGCFeature } from '@swissgeo/shared/ogc'

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
}

export interface ServerLayer extends Layer {
    record: OGCFeature // TODO maybe it doesn't make sense to keep the entire
    // record here... we only really need the layerId so far, with that we'll
    // call the nuxt API which will give us the needed information (e.g. capability url, style..)
}

export interface FileLayer extends Layer {}

export const makeServerLayer = (
    type: LayerType,
    record: OGCFeature,
    options?: Partial<Layer>
): ServerLayer => {
    const layerStore = useLayerStore()

    return {
        uuid: uuidv4(),
        humanId: record.id,
        opacity: 1,
        record,
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
