import type { GeoAdminGeoJSONStyleDefinition } from '@swissgeo/shared/geojson'
import type { OGCRecord, OGCRecords, Service, Protocol, Dataset } from '@swissgeo/ogc'
import type { Style } from '@types/mapbox-gl'

import { getStyleLinks } from "./utils"


/**
 * Go through the tree of the OGC records and extract the necessary information to request a
 * capability
 *
 * Following the links of a OGC feature, we extract the entry called 'distributions'. This will lead
 * us to the specification of the layer, which contains the links to the service. The service itself
 * contains the URL to the capabilities, which we return for the concrete implementations to be
 * used
 *
 * Since these operations are a cascade of server requests, the ORDER OF THE ELEMENTS IN HERE
 * MATTERS
 */
export async function useRecordsData(dataset: Dataset, protocol: Protocol) {
    const layerId = computed(() => dataset.id)

    // Get the distribution
    const distributionLink = computed(() => {
        const links = dataset.links
        for (const link of links) {
            if (link.rel?.toLowerCase() === 'distributions') {
                return link.href
            }
        }
    })

    const distributionData = await $fetch<OGCRecords>(distributionLink.value)

    // Extract the feature for the service
    const feature = computed((): OGCRecord => {
        if (!distributionData) {
            throw new Error('Unable to load distribution data')
        }

        const records = distributionData.records

        for (const feature of records) {
            if (!feature.properties) {
                break // go to exception below
            }
            if (feature.properties.protocol === protocol) {
                // we found the feature with the protocol that's requested, carry on
                return feature
            }
        }

        throw new Error(`Unable to find ${protocol} feature in distribution for ${layerId.value}. `)
    })

    /** Extract the capabilities URL from the OGC Record */
    const serviceUrl = computed(() => {
        const links = feature.value.links

        const link = getDataServiceLinks(links)[0]
        if (!link) {
            return null
            // throw new Error("Unable to find link for rel type 'service'")
        }
        const href = link.href

        if (!href) {
            throw new Error(
                `Faulty wmts record, neither href nor uriTemplate found: ${JSON.stringify(link)}`
            )
        }
        return href
    })

    // get the Service
    let serviceData: Service
    if (serviceUrl.value) {
        serviceData  = await $fetch<Service>(serviceUrl.value)
    }

    const capabilityUrl = computed(() => {
        // TODO safeguard for layers that don't support this
        if (!serviceData) {
            throw new Error(`Unable to load service data for ${serviceUrl.value}`)
        }

        if ('links' in serviceData && serviceData.links.length) {
            const link = serviceData.links[0]

            if (link.rel === 'about') {
                const uri = link.href
                return encodeURIComponent(uri)
            }
        }
        if ('linkTemplates' in serviceData && serviceData.linkTemplates.length) {
            // if there are links and linkTemplates, we want links to take precedence
            // it's the simpler version
            const link = serviceData.linkTemplates[0]

            if (link.rel === 'about') {
                const uri = link.uriTemplate.replace('{EPSG}', '2056')
                return uri
            }
        }
        throw new Error(`Unable to find links for ${serviceUrl.value}`)
    })

    const geoJsonUrl = computed(() => {
        // TODO safeguard for layers that don't support this
        if (!feature.value) {
            throw new Error(`Unable to load distribution data`)
        }

        const links = getGeoJsonDataLinks(feature.value.links)
        if (!links || links.length < 1) {
            throw new Error(
                `Unable to find geoJsonLink for distribution ${JSON.stringify(feature.value.links)}`
            )
        }
        return links[0].href
    })

    /**
     * Retrieve the style file if there is one references
     *
     * @param feature
     * @returns
     */
    const styleDataUrl = computed((): string | null => {
        const links = feature.value.links

        const link = getStyleLinks(links)[0]
        if (!link) {
            return null
        }

        const href = link.href

        if (!href) {
            throw new Error(`Faulty styledby record`)
        }
        return href
    })


    let styleData: Style | GeoAdminGeoJSONStyleDefinition | null = null
    if (styleDataUrl.value) {
       styleData = await $fetch<Style | GeoAdminGeoJSONStyleDefinition>(styleDataUrl.value)
    }

    const defaultOpacityFromStyle = computed(() => {
        // maybe do something here like a check for the geojson layers?
        const isRasterLayer = (layer: mapboxgl.AnyLayer): layer is mapboxgl.RasterLayer =>
            layer.type === 'raster'

        if (styleData && styleData.layers?.length) {
            // so far, we assume that the first and only entry is the correct one
            const layer = styleData.layers[0]

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

    return {
        serviceUrl,
        geoJsonUrl,
        styleData,
        capabilityUrl,
        defaultOpacityFromStyle,
    }
}
