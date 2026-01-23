import type { Paragraph } from './Paragraph'
import type { TitleComponent } from './Title'

export interface Publication {
    systemdata: Systemdata
    metadata: ContentPageMetadata | MenuMetadata
    content: ContentItem[]
    references?: Reference[]
}

export interface Design {
    name: string
    version: string
}

export interface Systemdata {
    version: number
    projectId: number
    channelId: number
    documentId: number
    contentType: string
    documentType: string
    title: string
    publicationId: number
    firstPublicationDate: string // ISO date string
    lastPublicationDate: string // ISO date string
    updatedAt: string // ISO date string
    significantPublicationDate: string // ISO date string
    visiblePublicationDate: string // ISO date string
    design: Design
    layout: string
}

export interface ContentPageMetadata {
    language: {
        locale: string
        groupId: string
    }
    slug: string
    twitterCard: string
    openGraphType: string
    seoRobots: string
    title: string
    twitterTitle: string
    openGraphTitle: string
    metaTitle: string
    description: string
    twitterDescription: string
    openGraphDescription: string
    metaDescription: string
}

export interface MenuMetadata {
    open: boolean
    name: string
    type: string
    tree: TreeItem[]
}

export interface Image {
    content: {
        image: string
        caption: string
    }
}

export interface Section {
    content: {
        section: ContentItem[]
    }
}

export type ContentItem = LeadContentPageWithCheckbox | Paragraph | Image

export interface LeadContentPageWithCheckbox {
    component: 'lead-contentpage-with-checkbox'
    identifier: string
    id: string
    content: {
        publicationDateCheckbox: {
            service: string
        }
    }
    containers: {
        'lead-contentpage-with-checkbox': TitleComponent[]
    }
}

export interface Reference {
    id: string
    type?: string
    location?: string
    propertyName?: string
}

export interface TreeItemTranslationItem {
    label: string
    reference: {
        id: string
    }
}

export interface TreeItem {
    id: string
    type: string
    items: TreeItem[]
    label?: string
    reference?: Reference
    translations?: Record<string, TreeItemTranslationItem>
}
