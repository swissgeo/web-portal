// TODO maybe this file shouldn't be here

import type { OGCRecord, Link } from '@swissgeo/shared/ogc'

const basePath = 'http://localhost:3000/api/v1/layers/swissgeo'

export const prependLinks = (records: OGCRecord[]) => {
    const newRecords = records.map((feature: OGCRecord) => {
        const newLinks = feature.links.map((link: Link) => {
            let href = link.href

            if (!href.startsWith('/')) {
                href = '/' + href
            }

            if (!link.href.startsWith('http')) {
                return {
                    ...link,
                    href: basePath + href,
                }
            }
            return link
        })
        return {
            ...feature,
            links: newLinks,
        }
    })
    return newRecords
}
