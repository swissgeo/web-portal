import type { Layer } from '@swissgeo/layers'
import type { Layer as MapLayer } from '@swissgeo/map'

export function projectLayersForMap(
    orderedLayers: Layer[],
    layersByUuid: Record<string, MapLayer>
): MapLayer[] {
    return orderedLayers
        .map((layer) => layersByUuid[layer.uuid])
        .filter((layer): layer is MapLayer => layer !== undefined)
}
