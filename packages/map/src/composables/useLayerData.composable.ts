import type { LayerData } from '@swissgeo/shared/api'
import type { Protocol } from '@swissgeo/shared/ogc'
import type mapboxgl from 'mapbox-gl'

export default async function useLayerData(layerId: string, protocol: Protocol) {
    const { data: layerData } = await useFetch<LayerData>(
        `/api/v1/layers/swissgeo/distributionData/${layerId}?protocol=${protocol}`
    )

    const capabilityUrl = computed(() => {
        if (!layerData.value?.capabilityLink) {
            throw new Error('Unable to find CapabilityLink in layerData')
        }

        const link = layerData.value?.capabilityLink

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
