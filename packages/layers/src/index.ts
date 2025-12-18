import { Feature as OGCFeature } from '@swissgeo/shared/ogc'
import { v4 as uuidv4 } from 'uuid'

import { useLayerStore } from '@/stores/layer'

export enum LayerType {
    WMTS = 'wmts',
    WMS = 'wms',
}

export interface Layer {
    uuid: string
    record: OGCFeature
    isVisible: boolean
    type: LayerType
    opacity: number
    isLoading: boolean
    zIndex: number
}

export const makeLayer = (record: OGCFeature, type: LayerType, options?: Partial<Layer>): Layer => {
    const layerStore = useLayerStore()

    return {
        uuid: uuidv4(),
        record,
        opacity: 1,
        isVisible: true,
        type,
        isLoading: false,
        zIndex: layerStore.greatestZIndex + 1,
        ...options,
    }
}

export { useLayerStore } from '@/stores/layer'
