export interface OGCRecords {
    type: string
    features: Feature[]
}

export interface Feature {
    id: string
    links: Link[]
    properties?: Property
}

export interface Language {
    code: string
    dir: string
    name: string
}

export interface Link {
    href: string
    rel: string
    type: string
    title: string
}

export interface LinkVariable {
    description: string
    format: string
    type: string
    enum?: (string | number)[]
}

export interface TemplateLink {
    uriTemplate: string
    type: string
    variables: Record<string, LinkVariable>
    title: string
}

export interface Property {
    attribution?: string
    externalIds?: string[]
    protocol?: Protocol
    contacts?: Contact[]
    language?: Language
    description?: string
    title: string
    type: string
}

export interface Contact {
    country: string
    role: string
    organisation: string
}

export interface Service {
    id: string
    linkTemplates?: TemplateLink[]
    links: Link[]
    properties?: Property
}

export type Protocol = 'OGC:WMTS' | 'OGC:WMS'
