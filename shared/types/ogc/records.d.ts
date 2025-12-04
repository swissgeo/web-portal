export interface OGCRecords {
    type: string
    features: Feature[]
}

export interface Feature {
    geocatId: string
    id: string
    language: Language
    links: Link[]
    properties: Property
}

export interface Language {
    code: string
    dir: string
    name: string
}

export interface Link {
    href?: string
    rel?: string
    title: string
    type: string
    protocol?: string
    templated?: boolean
    uriTemplate?: string
    variables?: LinkVariable
}

export interface LinkVariable {
    bbox?: Bbox
    crs?: Crs
    height?: Height
    width?: Width
    TileCol?: TileCol
    TileRow?: TileRow
    TileSetId?: TileSetId
}

export interface Bbox {
    description: string
    items: BBoxItem
    maxItems: number
    minItems: number
    type: string
}

export interface BBoxItem {
    format: string
    type: string
}

export interface Crs {
    description: string
    enum: string[]
    type: string
}

export interface Height {
    description: string
    format: string
    maximum: number
    minimum: number
    type: string
}

export interface Width {
    description: string
    format: string
    maximum: number
    minimum: number
    type: string
}

export interface TileCol {
    description: string
    format: string
    minimum: number
    type: string
}

export interface TileRow {
    description: string
    format: string
    minimum: number
    type: string
}

export interface TileSetId {
    description: string
    format: string
    maximum: number
    minimum: number
    type: string
}

export interface Property {
    attribution: string
    contacts: Contact[]
    description: string
    title: string
    type: string
    renders?: Renders
}

export interface Contact {
    country: string
    links: ContactLink[]
    name: string
}

export interface ContactLink {
    href: string
    rel: string
    title: string
    type: string
}

export interface Renders {
    'OGC:WMTS': OgcWmts
}

export interface OgcWmts {
    opacity: number
}
