import type { Link as OGCLink } from '@swissgeo/ogc'

// maybe this belongs to shared?
// or to a future layers package?

export const getLinksByRel = (links: OGCLink[], rel: string): OGCLink[] => {
    return links.filter((link: OGCLink) => link.rel?.toLowerCase() === rel.toLowerCase())
}

export const getDataServiceLinks = (links: OGCLink[]): OGCLink[] => {
    return getLinksByRel(links, 'service')
}
