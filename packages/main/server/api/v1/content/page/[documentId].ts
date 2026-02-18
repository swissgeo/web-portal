import type { LanguageReference, Page } from '@swissgeo/shared/api'
import type {
    Publication,
    ContentPageMetadata,
    Systemdata,
    MenuMetadata,
} from '@swissgeo/shared/livingdocs'

import log from '@swissgeo/log'
import useLdFetch from '~~/server/utils/ldFetch'
import { joinURL } from 'ufo'

export default defineEventHandler(async (event): Promise<Page | null> => {
    const runtimeConfig = useRuntimeConfig()
    const apiEndpoint = runtimeConfig.apiEndpoint

    const documentId = getRouterParam(event, 'documentId')

    const { ldFetch } = useLdFetch()

    const fetchPageData = async (documentId: string): Promise<Publication> => {
        const documentTarget = joinURL(apiEndpoint, 'documents', documentId, 'latestPublication')
        log.debug(`Fetching publication data from ${documentTarget}`)

        const pageData = await ldFetch<Publication>(documentTarget)

        log.debug('Done fetching publication data')

        return pageData
    }

    // using the search API to find the other language versions of the document
    const fetchLanguageData = async (
        groupId: string
    ): Promise<{ metadata: ContentPageMetadata | MenuMetadata; systemdata: Systemdata }[]> => {
        log.debug(
            `Searching API for other languages from publication ${documentId} with groupId ${groupId}`
        )

        const searchTarget =
            joinURL(apiEndpoint, 'publications', 'search') +
            `?languageGroupId=${groupId}&fields=systemdata,metadata`
        const searchData = await ldFetch<Page[]>(searchTarget)

        log.debug('Done searching other language data')
        return searchData
    }

    try {
        if (!documentId) {
            return null
        }

        const pageData = await fetchPageData(documentId)
        const groupId = (pageData.metadata as ContentPageMetadata).language.groupId
        const searchData = await fetchLanguageData(groupId)

        const searchDataFiltered = searchData.filter(
            (entry): entry is LanguageReference =>
                'language' in entry.metadata &&
                entry.systemdata.contentType === pageData.systemdata.contentType
        )

        return { ...pageData, languageReferences: searchDataFiltered }
    } catch (error) {
        log.error(`Unable to fetch data for ${documentId}: ${String(error)}`)
    }
    return null
})
