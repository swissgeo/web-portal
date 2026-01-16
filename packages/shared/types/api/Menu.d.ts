import type { Lang } from '~/Language'

export type Slug = string

export type DocumentId = string

export type MenuEntryLangaugeItem = {
    slug: Slug
    documentId: string
    label: string
}

/** The entry has language strings for keys ('de', 'fr') alongside an optional property 'children' */
export type MenuEntry = {
    [key in Lang]?: MenuEntryLangaugeItem
} & {
    // intersect it b/c we have mapped keys and a fixed keys, eslint otherwise
    // doesn't like this
    children?: MenuTree
}

export interface MenuTree extends Array<MenuEntry> {
    [index: number]: MenuEntry
}
