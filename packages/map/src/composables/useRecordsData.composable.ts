import type { Layer } from '@swissgeo/layers'
import type { OGCRecord, OGCRecords, Service, Protocol } from '@swissgeo/shared/ogc'

import { getDataServiceLinks } from '@/utils/recordUtils'

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
export default async function useRecordsData(layer: Layer, protocol: Protocol) {
    throw new Error('DEPRECATED') // Using the process on the server now!
    const layerId = computed(() => layer.dataset.id)

    // Get the distribution
    const distributionLink = computed(() => {
        const links = layer.dataset.links
        for (const link of links) {
            if (link.rel?.toLowerCase() === 'distributions') {
                return link.href
            }
        }
    })

    const { data: distributionData } = await useFetch<OGCRecords>(
        `/api/v1/layers/swissgeo/${distributionLink.value}`
    )

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
    const { data: serviceData } = await useFetch<Service>(
        `/api/v1/layers/service/swissgeo/${serviceUrl.value}`
    )

    const capabilityUrl = computed(() => {
        if (!serviceData.value) {
            throw new Error(`Unable to load service data for ${serviceUrl.value}`)
        }

        if ('links' in serviceData.value) {
            const link = serviceData.value.links[0]

            if (!link) {
                throw new Error(
                    `Unable to extract link to capabilities for the service ${serviceUrl.value}`
                )
            }

            const uri = link.href
            return encodeURIComponent(uri)
        } else if ('linkTemplates' in serviceData.value) {
            // if there are links and linkTemplates, we want links to take precedence
            // it's the simpler version
            const link = serviceData.value.linkTemplates[0]

            if (!link) {
                throw new Error(
                    `Unable to extract link to capabilities for the service ${serviceUrl.value}`
                )
            }

            const uri = link.uriTemplate.replace('{EPSG}', '2056')
            return encodeURIComponent(uri)
        }
        throw new Error(`Unable to find links for ${serviceUrl.value}`)
    })

    return {
        serviceUrl,
        capabilityUrl,
    }
}
