import type { Dataset, Distribution, DistributionCollection, ServiceProtocol } from '@types'

import log, { LogPreDefinedColor } from '@swissgeo/log'

import { getDataServiceLinks, getGeoJsonDataLinks, getStyleLinks } from './utils'

export function grabDistributionLink(dataset: Dataset): string {
    const links = dataset.links
    if (!links) {
        log.error({
            title: 'OGC Record',
            color: LogPreDefinedColor.Yellow,
            messages: ['There were no links in the dataset', dataset],
        })
        throw new Error('There were no links in the dataset')
    }
    for (const link of links) {
        if (link.rel?.toLowerCase() === 'distributions') {
            return link.href
        }
    }

    log.error({
        title: 'OGC Record Grab Distribution Link',
        color: LogPreDefinedColor.Yellow,
        messages: ['Unable to extract a distribution link', dataset.links],
    })
    throw new Error('No distribution link in OGC record')
}

export function extractDistribution(
    collection: DistributionCollection,
    protocol: ServiceProtocol
): Distribution {
    if (!collection) {
        throw new Error('Unable to load distribution data')
    }

    const records = collection.records

    for (const feature of records) {
        if (!feature.properties) {
            break // go to exception below
        }
        if (feature.properties.protocol === protocol) {
            // we found the feature with the protocol that's requested, carry on
            return feature
        }
    }

    log.error({
        title: 'OGC Records Extract Feature',
        color: LogPreDefinedColor.Yellow,
        messages: ['Unable to find ${protocol} in collection', collection],
    })
    throw new Error(`Unable to find ${protocol} feature in distribution `)
}

export function grabServiceUrl(distribution: Distribution): string | null {
    const links = distribution.links

    if (!links) {
        log.error({
            title: 'OGC Records grab service url',
            color: LogPreDefinedColor.Yellow,
            messages: ['Unable to grab service url from distribution', distribution],
        })
        throw new Error('Unable to grab service URL')
    }

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
}

export function grabCapabilityUrl(serviceData: Service): string {
    // TODO safeguard for layers that don't support this
    if (!serviceData) {
        throw new Error(`Unable to load service data`)
    }

    if ('links' in serviceData && serviceData.links && serviceData.links.length) {
        const link = serviceData.links[0]

        if (link!.rel === 'about') {
            const uri = link!.href
            return uri
        }
    }
    if (
        'linkTemplates' in serviceData &&
        serviceData.linkTemplates &&
        serviceData.linkTemplates.length
    ) {
        // if there are links and linkTemplates, we want links to take precedence
        // it's the simpler version
        const link = serviceData.linkTemplates[0]

        if (link!.rel === 'about') {
            const uri = link!.uriTemplate.replace('{EPSG}', '2056')
            return uri
        }
    }
    throw new Error(`Unable to find links for`)
}

export function grabGeoJsonUrl(distributionData: Distribution): string {
    // TODO safeguard for layers that don't support this
    if (!distributionData) {
        throw new Error(`Unable to load distribution data`)
    }

    if (!distributionData.links) {
        log.error({
            title: 'OGC Record grab geo json url',
            color: LogPreDefinedColor.Yellow,
            messages: ['Unable to find links in distribution', distributionData],
        })
        throw new Error(`Unable to find links for distribution}`)
    }

    const links = getGeoJsonDataLinks(distributionData.links)
    if (!links || links.length < 1) {
        log.error({
            title: 'OGC Record grab geo json url',
            color: LogPreDefinedColor.Yellow,
            messages: ['Unable to find geoJsonLink in distribution', distributionData],
        })
        throw new Error(`Unable to find geoJsonLink for distribution}`)
    }
    return links[0]!.href
}

export function grabStyleUrl(distributionData: Distribution): string {
    const links = distributionData.links

    if (!links) {
        log.error({
            title: 'OGC Record grab geo json url',
            color: LogPreDefinedColor.Yellow,
            messages: ['Unable to find links in distribution', distributionData],
        })
        throw new Error(`Unable to find links for distribution}`)
    }

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
