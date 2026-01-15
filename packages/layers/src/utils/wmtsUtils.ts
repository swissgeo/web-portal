import type { WMTSCapabilities } from '@swissgeo/shared/ogc'

import type { LayerInfo } from '@/types'

/** TODO maybe we don't need this, or at least not the way it's implemented now */
export function getLayerInfoFromWMTSCapabilities(
    capabilities: WMTSCapabilities,
    layerId: string
): LayerInfo {
    const Contents = capabilities.Contents
    const layers = Contents.Layer

    for (const layer of layers) {
        if (layer.Identifier === layerId) {
            return {
                displayName: layer.Title,
                abstract: layer.Abstract,
            }
        }
    }

    throw new Error(`Unable to find ${layerId} in wmts capabilities which should be impossible`)
    // or else why would we even get here?
}
