// #region: collection
/**
 * The basic collection type. This is a list of records
 */
export interface Collection<record extends OGCRecord<string>> {
    id: string
    type: 'Collection'
    records: record[]
    itemType: string
    title: string
    // portal?: {
    //     preferredDistributionId: string
    // }
}

export type DatasetCollection = Collection<Dataset>
export type DistributionCollection = Collection<Distribution>

// #endregion

// #region: record

/**
 * The basic record type. This contains the links to information as well
 * as a properties property with some additional information
 *
 * Record would clash with Typescript type
 */
export interface OGCRecord<recordType extends string> {
    id: string
    links?: Link[]
    linkTemplates?: TemplateLink[]
    properties: Property<recordType>
}

/**
 *  Concrete Record Types
 */
export type Dataset = OGCRecord<'Dataset'>
export type Distribution = OGCRecord<'Distribution'>
export type Service = OGCRecord<ServiceProtocol>

// #endregion

// #region Specific types
export interface Language {
    code: string
    dir: string
    name: string
    alternate?: string
}

export interface Link {
    href: string
    rel: string
    type?: string
    title?: string
}

export interface LinkVariable {
    type: string
    description: string
    format?: string
    default?: string | number
    enum?: (string | number)[]
}

export interface TemplateLink {
    uriTemplate: string
    type: string
    variables: Record<string, LinkVariable>
    title: string
    rel: string
}

export interface Property<recordType extends string> {
    title: string
    type: recordType
    // TODO maybe we'll have to split this away to a "service property"
    protocol?: ServiceProtocol
    attribution?: string
    externalIds?: string[]
    contacts?: Contact[]
    language?: Language
    languages?: Language[]
    description?: string
    // TODO maybe this is only available in the Dataset props
    preferredDistributionId?: string
}

export interface Contact {
    country: string
    role: string
    organisation: string
}

export type ServiceProtocol = 'OGC:WMTS' | 'OGC:WMS' | 'OGC:GeoJSON'
