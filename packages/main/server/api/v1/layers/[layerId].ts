import type {
    OGCRecords,
    Protocol,
    TemplateLink,
    Link,
    Feature,
    Service,
} from '@swissgeo/shared/ogc'

import fs from 'node:fs/promises'

let catalog: OGCRecords | undefined

// TODO taken from map utils.. maybe they should be shared or something
// maybe there should be a OGC package?!
export const getLinksByRel = (links: Link[], rel: string): Link[] => {
    return links.filter((link: Link) => link.rel?.toLowerCase() === rel.toLowerCase())
}

export const getDataServiceLinks = (links: Link[]): Link[] => {
    return getLinksByRel(links, 'dataservice')
}

const readCatalog = async () => {
    // path is relative to the package
    const path = `../../ogc-records/swissgeo.catalog`
    const data = await fs.readFile(path)

    return JSON.parse(data.toString())
}

const getFeatureFromCatalog = async (layerId: string) => {
    if (!catalog) {
        catalog = await readCatalog()
    }

    for (const feature of catalog!.features) {
        if (feature.id === layerId) {
            return feature
        }
    }

    throw new Error(`Unable to find feature for ${layerId} in the catalog`)
}

const getDistributionLink = (record: Feature) => {
    const links = record.links

    for (const link of links) {
        if (link.rel?.toLowerCase() === 'distributions') {
            if (link.href) {
                return link.href
            }
        }
    }

    throw new Error('Unable to find distribution link')
}

const getDistributionData = async (distributionLink: string) => {
    const distributionData = await $fetch<OGCRecords>(`/api/v1/layers/${distributionLink}`)
    return distributionData
}

const extractFeature = (distributionData: OGCRecords, protocol: Protocol) => {
    const features = distributionData.features

    for (const feature of features) {
        if (!feature.properties) {
            break // go to exception below
        }
        if (feature.properties.protocol === protocol) {
            // we found the feature with the protocol that's requested, carry on
            return feature
        }
    }

    throw new Error(
        `Unable to find ${protocol} feature in distribution for ${JSON.stringify(distributionData)}. `
    )
}

const getServiceUrl = (feature: Feature) => {
    const links = feature.links

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
}

const getServiceData = async (serviceUrl: string) => {
    return await $fetch<Service>(`/api/v1/layers/service/${serviceUrl}`)
}

const getCapabilityLink = (serviceData: Service): Link | TemplateLink => {
    if ('links' in serviceData) {
        const link = serviceData.links[0]

        if (!link) {
            throw new Error(
                `Unable to extract link to capabilities for the service ${JSON.stringify(serviceData)}`
            )
        }

        return link
    } else if ('linkTemplates' in serviceData) {
        // if there are links and linkTemplates, we want links to take precedence
        // it's the simpler version
        const link = serviceData.linkTemplates[0]

        if (!link) {
            throw new Error(
                `Unable to extract link to capabilities for the service ${JSON.stringify(serviceData)}`
            )
        }

        return link
    }
    throw new Error(`Unable to find links for ${JSON.stringify(serviceData)}`)
}

/**
 * Go through the tree of the OGC records and extract the necessary information to request a
 * capability
 *
 * Following the links of a OGC feature, we extract the entry called 'distributions'. This will lead
 * us to the specification of the layer, which contains the links to the service. The service itself
 * contains the URL to the capabilities, which we return for the concrete implementations to be
 * used
 */
const getLayerData = async (layerId: string, protocol: Protocol) => {
    const feature = await getFeatureFromCatalog(layerId)
    const distributionLink = getDistributionLink(feature)
    const distributionData = await getDistributionData(distributionLink)
    const distributionFeature = extractFeature(distributionData, protocol)
    const serviceUrl = getServiceUrl(distributionFeature)
    const serviceData = await getServiceData(serviceUrl)

    const capabilityLink = getCapabilityLink(serviceData)

    return {
        capabilityLink,
    }
}

export default defineEventHandler(async (event) => {
    const param = getRouterParam(event, 'layerId')
    const query = getQuery(event)

    if (!param) {
        throw createError({
            status: 400,
            statusMessage: 'Bad Request',
            message: 'Layer ID parameter not provided',
        })
    }

    if (!query.protocol) {
        throw createError({
            status: 400,
            statusMessage: 'Bad Request',
            message: '',
        })
    }

    const protocol = query.protocol as Protocol // TODO validate this
    const layerId = decodeURIComponent(param)

    try {
        const layerData = await getLayerData(layerId, protocol)

        appendResponseHeader(event, 'Content-Type', 'application/json')
        appendResponseHeader(event, 'Cache-Control', `max-age=${60 * 60}`)
        return layerData
    } catch (error: unknown) {
        throw createError({
            status: 500,
            statusMessage: 'Internal Server Error',
            // @ts-expect-error 2322
            message: error,
        })
    }
})
