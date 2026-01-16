import type { LayerData } from '@swissgeo/shared/api'
import type { Dataset, Protocol } from '@swissgeo/shared/ogc'
import type mapboxgl from 'mapbox-gl'

// TODO maybe don't only use layerId as param, otherwise we could have interfering
// names!!!!
// e.g. if two different dataset/distribution/service Sets contain a layer
// with the same name, then this here would be a problem when the request
// is cached
export default async function useLayerData(dataset: Dataset, protocol: Protocol) {
    const layerId = dataset.id
    const layerData = await $fetch<LayerData>(
        `/api/v1/layers/distributionData/${layerId}?protocol=${protocol}`,
        {
            method: 'POST',
            body: dataset,
        }
    )

    const capabilityUrl = computed(() => {
        if (!layerData.capabilityLink) {
            throw new Error('Unable to find CapabilityLink in layerData')
        }

        const link = layerData.capabilityLink

        if ('href' in link) {
            return encodeURIComponent(link.href)
        } else if ('uriTemplate' in link) {
            return encodeURIComponent(link.uriTemplate.replace('{EPSG}', '2056'))
        }

        throw new Error(`Unable to read link from ${JSON.stringify(layerData.value)}`)
    })

    const styleData = computed(() => {
        if (!layerData.value?.styleData) {
            return null
        }

        const data = layerData.value.styleData
        return data
    })

    const defaultOpacityFromStyle = computed(() => {
        const isRasterLayer = (layer: mapboxgl.AnyLayer): layer is mapboxgl.RasterLayer =>
            layer.type === 'raster'

        if (styleData.value && styleData.value.layers && styleData.value?.layers?.length) {
            // so far, we assume that the first and only entry is the correct one
            const layer = styleData.value.layers[0]

            if (!layer || !isRasterLayer(layer)) {
                return 1
            }

            const paint = layer.paint
            const rasterOpacity = paint?.['raster-opacity']
            if (rasterOpacity && typeof rasterOpacity === 'number') {
                return rasterOpacity
            }
        }
        return 1
    })

    return { capabilityUrl, defaultOpacityFromStyle }
}
