import type { LayerFormat } from '@swissgeo/map'
import type { Distribution } from '@swissgeo/ogc'

export function determineFormat(
    distribution: Pick<Distribution, 'properties'> | null
): LayerFormat | null {
    if (!distribution?.properties) {
        return null
    }

    const protocol = distribution.properties.protocol

    // the protocol is at the moment OGC:(WMTS|WMS)
    switch (protocol?.toLowerCase()) {
        case 'ogc:wmts':
            return 'WMTS'
        case 'ogc:wms':
            return 'WMS'
        default:
            return null
    }
}
