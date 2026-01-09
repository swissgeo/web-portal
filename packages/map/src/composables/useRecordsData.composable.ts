import type { Feature as OGCFeature, OGCRecords, Service } from '@swissgeo/shared/ogc'

import { useLayerStore, type ServerLayer } from '@swissgeo/layers'

import { getDataServiceLinks } from '@/utils/recordUtils'

export default async function useRecordsData(layer: ServerLayer) {
    const layerId = computed(() => layer.record.id)

    const distributionLink = computed(() => {
        const links = layer.record.links
        for (const link of links) {
            if (link.rel?.toLowerCase() === 'distributions') {
                return link.href
            }
        }
    })

    const { data: distributionData } = await useFetch<OGCRecords>(
        `/api/v1/layers/${distributionLink.value}`
    )

    const wmtsFeature = computed((): OGCFeature => {
        if (!distributionData.value) {
            throw new Error('Unable to load distribution data')
        }

        const features = distributionData.value.features

        for (const feature of features) {
            if (!feature.properties) {
                break // go to exception below
            }
            if (feature.properties.protocol === 'OGC:WMTS') {
                return feature
            }
        }

        throw new Error(
            `Unable to find WMTS feature in distribution for ${layerId.value}. ` +
                `This layer probably shouldn't be treated as a WMTS layer`
        )
    })

    /** Extract the capabilities URL from the OGC Record */
    const serviceUrl = computed(() => {
        const links = wmtsFeature.value.links

        const link = getDataServiceLinks(links)[0]
        if (!link) {
            throw new Error("Unable to find link for rel type 'dataservice'")
        }
        const href = link.href

        if (!href) {
            throw new Error(
                `Faulty wmts record, neither href nor uriTemplate found: ${JSON.stringify(link)}`
            )
        }
        return href
    })

    // TODO ok here we have a bit of a tight coupling with the main package
    const { data: serviceData } = await useFetch<Service>(
        `/api/v1/layers/service/${serviceUrl.value}`
    )

    const capabilityUrl = computed(() => {
        const link = serviceData.value.linkTemplates[0]

        if (!link) {
            throw new Error('Unable to extract link to capabilities for the service')
        }

        // TODO make it work with more flexible versions for the link
        const uri = link.uriTemplate.replace('{EPSG}', '2056')
        return encodeURIComponent(uri)
    })

    return {
        serviceUrl,
        capabilityUrl,
    }
}
