import type { Page } from '@swissgeo/shared/api'
import type { ContentPageMetadata } from '@swissgeo/shared/livingdocs'

export const useLivingdocsPageData = () => {
    const getContainers = (data: Page) => {
        if (!data.content?.[0]) {
            return []
        }

        const content = data.content

        return content
    }

    const getMetadata = (data: Page): ContentPageMetadata | null => {
        if (!data) {
            return null
        }
        return data.metadata as ContentPageMetadata
    }

    return {
        getContainers,
        getMetadata,
    }
}
