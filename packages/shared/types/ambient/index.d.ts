/* eslint-disable @typescript-eslint/consistent-type-imports */
// trying to make some globally available things from nuxt known
// to the subpackages
export interface RuntimeConfig {
    apiEndpoint: string
    authToken: string
    public: {
        overlayId: string
        aboutMenu: {
            id: number
            translationKey: string
        }
        knowledgeMenu: {
            id: number
            translationKey: string
        }
        ogcApiEndpoint: string
        gitCommit: string
        version: string
        buildTime: string
    }
}

declare global {
    const useRuntimeConfig: typeof import('nuxt').useRuntimeConfig
    const useFetch: typeof import('nuxt').useFetch
    const $fetch: typeof import('nuxt').$fetch
}
