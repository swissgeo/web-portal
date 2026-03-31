import type { Layer as StoreLayer } from '@swissgeo/layers'
import type { WMSLayer } from '@swissgeo/map'

import { describe, expect, it } from 'vitest'

import { projectLayersForMap } from '../layerOrder'

function createStoreLayer(uuid: string): StoreLayer {
    return {
        uuid,
    } as StoreLayer
}

function createMapLayer(uuid: string, zIndex: number): WMSLayer {
    return {
        uuid,
        zIndex,
        format: 'WMS',
        layerId: `layer-${uuid}`,
        opacity: 1,
        isVisible: true,
        dimensions: {},
        gutter: 0,
        url: 'https://example.test/wms',
        version: '1.3.0',
        lang: 'de',
    }
}

describe('projectLayersForMap', () => {
    it('returns map layers in exact store order', () => {
        const orderedStoreLayers = [createStoreLayer('b'), createStoreLayer('a')]
        const layersByUuid = {
            a: createMapLayer('a', 10),
            b: createMapLayer('b', 20),
        }

        const projected = projectLayersForMap(orderedStoreLayers, layersByUuid)

        expect(projected.map((layer) => layer.uuid)).toEqual(['b', 'a'])
    })

    it('omits entries not present in layersByUuid', () => {
        const orderedStoreLayers = [createStoreLayer('a'), createStoreLayer('missing')]
        const layersByUuid = {
            a: createMapLayer('a', 10),
        }

        const projected = projectLayersForMap(orderedStoreLayers, layersByUuid)

        expect(projected.map((layer) => layer.uuid)).toEqual(['a'])
    })
})
