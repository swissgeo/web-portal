import type { LanguageReference, Page } from '@swissgeo/shared/api'
import type { RouteRecordRaw } from 'vue-router'

export const SUPPORTED_LANG = ['de', 'fr']

export type Language = (typeof SUPPORTED_LANG)[number]

export const useContentStore = defineStore('contentStore', () => {
    const router = useRouter()

    // #region: data
    const currentPageData = ref<Page>()
    // #endregion

    // #region: getters

    // #endregion

    // #region: actions
    function setCurrentPageData(data: Page) {
        currentPageData.value = data
    }

    function findDocumentInRoutes(
        routes: RouteRecordRaw[],
        documentId: number
    ): RouteRecordRaw | null {
        for (const route of routes) {
            if (route.children) {
                const child = findDocumentInRoutes(route.children, documentId)
                if (child) {
                    return child
                }
            }

            if (
                route.meta &&
                route.meta.fromApi &&
                route.meta.documentId === documentId.toString()
            ) {
                return route
            }
        }

        return null
    }

    /**
     * Since we have nested routes, we look for the first occurrence of the other language's document
     * ID in the route tree
     */
    function getPageRouteInLanguage(lang: Language): RouteRecordRaw | null {
        const documentId = currentPageData.value?.languageReferences?.find(
            (reference: LanguageReference) => reference.metadata.language.locale === lang
        )?.systemdata.documentId

        if (!documentId) {
            return null
        }

        const routes = router.getRoutes()
        const route = findDocumentInRoutes(routes, documentId)

        return route
    }
    // #endregion

    return {
        currentPageData,
        // #region: getters
        // #endregion
        // #region: actions
        setCurrentPageData,
        getPageRouteInLanguage,
        findDocumentInRoutes,
        // #endregion
    }
})
