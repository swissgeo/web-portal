import type { OGCRecord, OGCRecords, Service, Protocol, Link, Dataset } from '@swissgeo/ogc'
import type { Style } from '@types/mapbox-gl'

// maybe there should be a OGC package?!
// TODO there should definitely be one
const getLinksByRel = (links: Link[], rel: string): Link[] => {
    return links.filter((link: Link) => link.rel?.toLowerCase() === rel.toLowerCase())
}

const getDataServiceLinks = (links: Link[]): Link[] => {
    return getLinksByRel(links, 'service')
}

const getStyleLinks = (links: Link[]): Link[] => {
    return getLinksByRel(links, 'styledby')
}

export const getGeoJsonDataLinks = (links: Link[]): Link[] => {
    return getLinksByRel(links, 'data').filter((link: Link) => {
        return link.type === 'application/geo+json'
    })
}

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
export default async function useRecordsData(dataset: Dataset, protocol: Protocol) {
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

    const { data: distributionData } = await useFetch<OGCRecords>(distributionLink.value)

    // Extract the feature for the service
    const feature = computed((): OGCRecord => {
        if (!distributionData.value) {
            throw new Error('Unable to load distribution data')
        }

        const records = distributionData.value.records

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
            throw new Error("Unable to find link for rel type 'service'")
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
    const { data: serviceData } = await useFetch<Service>(serviceUrl.value)

    const capabilityUrl = computed(() => {
        // TODO safeguard for layers that don't support this
        if (!serviceData.value) {
            throw new Error(`Unable to load service data for ${serviceUrl.value}`)
        }

        if ('links' in serviceData.value && serviceData.value.links.length) {
            const link = serviceData.value.links[0]

            if (link.rel === 'about') {
                const uri = link.href
                return encodeURIComponent(uri)
            }
        }
        if ('linkTemplates' in serviceData.value && serviceData.value.linkTemplates.length) {
            // if there are links and linkTemplates, we want links to take precedence
            // it's the simpler version
            const link = serviceData.value.linkTemplates[0]

            if (link.rel === 'about') {
                const uri = link.uriTemplate.replace('{EPSG}', '2056')
                return encodeURIComponent(uri)
            }
        }
        throw new Error(`Unable to find links for ${serviceUrl.value}`)
    })

    const geoJsonUrl = computed(() => {
        // TODO safeguard for layers that don't support this
        if (!feature.value) {
            throw new Error(`Unable to load distribution data`)
        }

        const links = getGeoJsonDataLinks(distributionData.value)
        if (!links || links.length < 1) {
            throw new Error(
                `Unable to find geoJsonLink for distribution ${JSON.stringify(distributionData.value)}`
            )
        }
        return links[0]
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

    const styleData = await useFetch<Style>(styleDataUrl)

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

    return {
        serviceUrl,
        geoJsonUrl,
        styleData,
        capabilityUrl,
        defaultOpacityFromStyle,
    }
}
