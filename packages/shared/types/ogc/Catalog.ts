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
    href?: string
    rel?: string
    type: string
    //templated?: boolean
    //uriTemplate?: string
    //variables?: LinkVariable
}

export interface Property {
    attribution?: string
    externalIds?: string[]
    protocol?: string
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
    linkTemplates: Link[]
    properties?: Property
}
