import type { DatasetLayer, Dimension } from '@swissgeo/layers'

import { describe, expect, it } from 'vitest'

import { mapDatasetLayerToMapLayer } from '../datasetLayerMapper'

function makeDatasetLayer(partial: Partial<DatasetLayer> = {}): DatasetLayer {
  return {
    uuid: partial.uuid ?? 'layer-uuid',
    humanId: partial.humanId ?? 'human-id',
    isVisible: partial.isVisible ?? true,
    type: partial.type ?? 'wmts',
    opacity: partial.opacity ?? 1,
    isLoading: partial.isLoading ?? false,
    info: partial.info,
    dataset: partial.dataset ?? ({ id: 'dataset-id' } as never),
    dimensions: partial.dimensions,
  }
}

describe('mapDatasetLayerToMapLayer', () => {
  it('maps common fields and preserves layer info metadata', () => {
    const dimensions = {
      time: {
        currentValue: '2025-01-01T00:00:00Z',
        availableValues: ['2025-01-01T00:00:00Z'],
      },
    } as Partial<Record<'time', Dimension>>

    const sourceLayer = makeDatasetLayer({
      uuid: 'uuid-1',
      isVisible: false,
      opacity: 0.42,
      dimensions,
      info: {
        displayName: 'Layer Display Name',
        attribution: {
          title: 'Attribution Source',
          url: 'https://example.com',
        },
      },
    })

    const result = mapDatasetLayerToMapLayer({
      layer: sourceLayer,
      layerId: 'layer-id-1',
      layerType: 'WMTS',
      layerSpecificData: { options: { tileGrid: {} } },
      zIndex: 7,
    })

    expect(result.layerId).toBe('layer-id-1')
    expect(result.type).toBe('WMTS')
    expect(result.uuid).toBe('uuid-1')
    expect(result.isVisible).toBe(false)
    expect(result.opacity).toBe(0.42)
    expect(result.zIndex).toBe(7)
    expect(result.dimensions).toEqual(dimensions)
    expect(result.info).toEqual(sourceLayer.info)
  })

  it('normalizes null info to undefined for map-layer compatibility', () => {
    const sourceLayer = makeDatasetLayer({ info: null })

    const result = mapDatasetLayerToMapLayer({
      layer: sourceLayer,
      layerId: 'layer-id-2',
      layerType: 'WMS',
      layerSpecificData: undefined,
      zIndex: 3,
    })

    expect(result.info).toBeUndefined()
  })
})
