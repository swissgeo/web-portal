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

    const link = computed(() => {
        if (protocol === 'OGC:GeoJSON') {
            return layerData.geoJsonDataLink
        } else {
            return layerData.capabilityLink
        }
    })

    /**
     * URL could mean different things depending on the protocol I don't know yet if I like this
     * idea
     */
    const url = computed(() => {
        if (!link.value) {
            throw new Error('Unable to find the needed link in layerData')
        }

        if ('href' in link.value) {
            return encodeURIComponent(link.value.href)
        } else if ('uriTemplate' in link.value) {
            return encodeURIComponent(link.value.uriTemplate.replace('{EPSG}', '2056'))
        }

        throw new Error(`Unable to read link from ${JSON.stringify(layerData)}`)
    })

    const styleData = computed(() => {
        if (!layerData.styleData) {
            return null
        }

        const data = layerData.styleData
        return data
    })

    const defaultOpacityFromStyle = computed(() => {
        // maybe do something here like a check for the geojson layers?
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

    return { url, styleData, defaultOpacityFromStyle }
}
