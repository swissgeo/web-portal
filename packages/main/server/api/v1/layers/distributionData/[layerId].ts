import type {
    OGCRecords,
    Protocol,
    TemplateLink,
    Link,
    Feature,
    Service,
} from '@swissgeo/shared/ogc'
import type { Style } from '@types/mapbox-gl'
import type { H3Event } from 'h3'

let catalog: OGCRecords | undefined

// TODO taken from map utils.. maybe they should be shared or something
// maybe there should be a OGC package?!
export const getLinksByRel = (links: Link[], rel: string): Link[] => {
    return links.filter((link: Link) => link.rel?.toLowerCase() === rel.toLowerCase())
}

export const getDataServiceLinks = (links: Link[]): Link[] => {
    return getLinksByRel(links, 'service')
}

export const getStyleLinks = (links: Link[]): Link[] => {
    return getLinksByRel(links, 'styledby')
}

const getDistributionData = async (record: Feature) => {
    const getDistributionLink = () => {
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

    const distributionLink = getDistributionLink()

    const distributionData = await $fetch<OGCRecords>(distributionLink)
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

const getServiceData = async (feature: Feature) => {
    const getServiceUrl = () => {
        const links = feature.links

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
    }

    const serviceUrl = getServiceUrl()
    return await $fetch<Service>(serviceUrl)
}

/**
 * Retrieve the style file if there is one references
 *
 * @param feature
 * @returns
 */
const getStyleData = async (feature: Feature): Promise<Style | null> => {
    const getStyleUrl = () => {
        const links = feature.links

        const link = getStyleLinks(links)[0]
        if (!link) {
            return null
        }

        const href = link.href

        if (!href) {
            throw new Error(`Faulty styledby record`)
        }
        return href
    }

    const styleUrl = getStyleUrl()

    if (styleUrl) {
        // return style or return the URL?
        return await $fetch(styleUrl)
    } else {
        return null
    }
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
const getLayerData = async (event: H3Event, layerId: string, protocol: Protocol) => {
    const dataset = await readBody(event)
    const distributionData = await getDistributionData(dataset)

    const distributionFeature = extractFeature(distributionData, protocol)
    const serviceData = await getServiceData(distributionFeature)
    const styleData = (await getStyleData(distributionFeature)) || {}

    const capabilityLink = getCapabilityLink(serviceData)

    return {
        capabilityLink,
        styleData,
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
        const layerData = await getLayerData(event, layerId, protocol)

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
