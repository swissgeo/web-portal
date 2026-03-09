import type { Link } from '@/types/Records'

export const getLinksByRel = (links: Link[], rel: string): Link[] => {
    return links.filter((link: Link) => link.rel?.toLowerCase() === rel.toLowerCase())
}
