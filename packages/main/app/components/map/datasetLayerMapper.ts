import type { DatasetLayer } from '@swissgeo/layers'
import type { Layer as MapLayer, LayerType } from '@swissgeo/map'

type LayerSpecificData = Record<string, unknown> | undefined

interface MapDatasetLayerParams {
    layer: DatasetLayer
    layerId: string | null
    layerType: LayerType
    layerSpecificData: LayerSpecificData
    zIndex: number
}

export function mapDatasetLayerToMapLayer({
    layer,
    layerId,
    layerType,
    layerSpecificData,
    zIndex,
}: MapDatasetLayerParams): MapLayer {
    return {
        layerId: layerId ?? layer.humanId,
        type: layerType,
        ...(layerSpecificData ?? {}),
        uuid: layer.uuid,
        dimensions: layer.dimensions,
        isVisible: layer.isVisible,
        opacity: layer.opacity,
        zIndex,
        info: layer.info ?? undefined,
    }
}
