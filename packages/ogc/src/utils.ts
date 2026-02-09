export const getLinksByRel = (links: Link[], rel: string): Link[] => {
    return links.filter((link: Link) => link.rel?.toLowerCase() === rel.toLowerCase())
}

export const getDataServiceLinks = (links: Link[]): Link[] => {
    return getLinksByRel(links, 'service')
}

export const getDataLinks = (links: Link[]): Link[] => {
    return getLinksByRel(links, 'data')
}

export const getStyleLinks = (links: Link[]): Link[] => {
    return getLinksByRel(links, 'styledby')
}

export const getGeoJsonDataLinks = (links: Link[]): Link[] => {
    return getDataLinks(links).filter((link: Link) => {
        return link.type === 'application/geo+json'
    })
}
