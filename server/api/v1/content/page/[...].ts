import type { Page } from '~~/shared/types/api/Page'
import type {
    Publication,
    ContentPageMetadata,
    Systemdata,
} from '~~/shared/types/livingdocs/Publication'

import useLdFetch from '~~/server/utils/ldFetch'
import { joinURL } from 'ufo'

export default defineEventHandler(async (event): Promise<Page> => {
    const runtimeConfig = useRuntimeConfig()
    const apiEndpoint = runtimeConfig.apiEndpoint

    const documentId = event.path.split('/').pop() || ''

    const { ldFetch } = useLdFetch()

    const fetchPageData = async (documentId: string): Promise<Publication> => {
        const documentTarget = joinURL(apiEndpoint, 'documents', documentId, 'latestPublication')
        console.log(`Fetching publication data from ${documentTarget}`)

        const pageData = await ldFetch<Publication>(documentTarget)

        console.log('Done fetching publication data')

        return pageData
    }

    // using the search API to find the other language versions of the document
    const fetchLanguageData = async (
        groupId: string
    ): Promise<{ metadata: ContentPageMetadata; systemdata: Systemdata }[]> => {
        console.log(
            `Searching API for other languages from publication ${documentId} with groupId ${groupId}`
        )

        const searchTarget =
            joinURL(apiEndpoint, 'publications', 'search') +
            `?languageGroupId=${groupId}&fields=systemdata,metadata`
        const searchData = await ldFetch<Page[]>(searchTarget)

        console.log('Done searching other language data')
        return searchData
    }

    try {
        const pageData = await fetchPageData(documentId)
        const groupId = (pageData.metadata as ContentPageMetadata).language.groupId
        const searchData = await fetchLanguageData(groupId)

        const searchDataFiltered = searchData.filter(
            (entry) => entry.systemdata.contentType === pageData.systemdata.contentType
        )

        return { ...pageData, languageReferences: searchDataFiltered }
    } catch (error) {
        console.error(`Unable to fetch data for ${documentId}`, error)
    }
    return {}
})
