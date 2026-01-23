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
    }
}

declare global {
    function useRuntimeConfig(): RuntimeConfig
}
