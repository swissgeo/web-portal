import type { WMSCapabilities } from '@swissgeo/shared/ogc'

import type { LayerInfo } from '@/types'

export function getLayerInfoFromWMSCapabilities(
    capabilities: WMSCapabilities,
    layerId: string
): LayerInfo {
    const Capability = capabilities.Capability
    const layers = Capability.Layer.Layer

    for (const layer of layers) {
        if (layer.Name === layerId) {
            return {
                displayName: layer.Title,
                abstract: layer.Abstract,
                attribution: {
                    title: layer.Attribution.title,
                    url: layer.Attribution.OnlineResource,
                    logoUrl: layer.Attribution.LogoURL,
                },
            }
        }
    }

    throw new Error(`Unable to find ${layerId} in wms capabilities`)
    // somehow there are layers available that point to the capabilities,
    // but then they're not in there! See ch.bfe.komo-projekte
}
