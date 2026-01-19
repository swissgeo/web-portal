import type { Link as OGCLink } from '@swissgeo/shared/ogc'

// maybe this belongs to shared?
// or to a future layers package?

export const getLinksByProtocol = (links: OGCLink[], protocol: string): OGCLink[] => {
    throw new Error("We don't have protocol in links anymore!")
    return links.filter((link: OGCLink) => link.protocol === protocol)
}

export const getLinksByRel = (links: OGCLink[], rel: string): OGCLink[] => {
    return links.filter((link: OGCLink) => link.rel?.toLowerCase() === rel.toLowerCase())
}

export const getDataServiceLinks = (links: OGCLink[]): OGCLink[] => {
    return getLinksByRel(links, 'service')
}
