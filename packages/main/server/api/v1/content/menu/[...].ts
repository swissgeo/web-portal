import type { MenuEntry, MenuEntryLangaugeItem, MenuTree } from '@swissgeo/shared/api'
import type {
    ContentPageMetadata,
    MenuMetadata,
    Publication,
    TreeItem,
} from '@swissgeo/shared/livingdocs'

import log from '@swissgeo/log'
import useLdFetch from '~~/server/utils/ldFetch'
import { joinURL } from 'ufo'

export default defineEventHandler(async (event) => {
    const documentId = event.path.split('/').pop() || ''
    const runtimeConfig = useRuntimeConfig()
    const apiEndpoint = runtimeConfig.apiEndpoint

    const { ldFetch } = useLdFetch()

    const fetchMenu = async (): Promise<Publication> => {
        const target = joinURL(apiEndpoint, 'documents', documentId, 'latestPublication')
        log.debug(`Fetching menus from ${target}`)

        const data = await ldFetch<Publication>(target)

        return data
    }

    const fetchPublicationMetadata = async (
        documentId: string,
        lang: string,
        ptData: Omit<MenuEntryLangaugeItem, 'lang' | 'documentId' | 'slug'> // passthrough data
    ): Promise<[string, MenuEntryLangaugeItem]> => {
        const target =
            joinURL(apiEndpoint, 'documents', documentId, 'latestPublication') + '?fields=metadata'

        const data = await ldFetch<Publication>(target)
        const slug = (data.metadata as ContentPageMetadata).slug

        return [lang, { slug, documentId, ...ptData }]
    }

    /**
     * For all the translation that the document at given menu entry has, we go and fetch the
     * document data so that we also know additional info like the slug
     *
     * @param tree
     * @returns {'lang': { slug, documentId, label}}
     */
    const fetchSlugsForItem = async (tree: TreeItem): Promise<MenuEntry> => {
        const translations = tree.translations

        const promises = []
        if (translations) {
            for (const locale of Object.keys(translations)) {
                const id = translations[locale].reference.id
                const label = translations[locale].label

                promises.push(fetchPublicationMetadata(id, locale, { label }))
            }
        } else if (tree.reference?.id) {
            // no translations, let's just push the existing
            const id = tree.reference?.id
            const label = tree.label || ''
            const lang = 'de'

            promises.push(fetchPublicationMetadata(id, lang, { label }))
        } else {
            throw Error(`Can't handle datastructure for ${JSON.stringify(tree)}`)
        }

        const values = await Promise.all(promises)
        return Object.fromEntries(values)
    }

    const traverseTree = async (tree: TreeItem[]): Promise<MenuTree> => {
        const mapped = tree.map(async (treeItem) => {
            let children
            if (treeItem.items && treeItem.items.length) {
                children = await traverseTree(treeItem.items)
            }

            const data = await fetchSlugsForItem(treeItem)

            return { ...data, children }
        })

        return Promise.all(mapped)
    }

    try {
        const menuData = fetchMenu()
        const tree = ((await menuData).metadata as MenuMetadata).tree

        const translatedData = await traverseTree(tree)

        return translatedData
    } catch (err) {
        // @ts-expect-error Exception types in JS are a PITA
        log.error(err)
    }
    log.debug('Done fetching menus')

    return {}
})
