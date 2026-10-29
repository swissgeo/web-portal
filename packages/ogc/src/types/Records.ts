// #region: collection
/**
 * The basic collection type. This is a list of records
 */
export interface Collection<record extends Feature<string>> {
  type: "FeatureCollection";
  features: record[];
  links: Link[];
  numberMatched?: number;
  numberReturned?: number;
}

export type DatasetCollection = Collection<Dataset>;
export type DistributionCollection = Collection<Distribution>;

// #endregion

// #region: record

/**
 * The basic record type. This contains the links to information as well
 * as a properties property with some additional information
 */
export interface Feature<recordType extends string> {
  id: string;
  links?: Link[];
  linkTemplates?: TemplateLink[];
  properties: Property<recordType>;
}

/**
 *  Concrete Record Types
 */
export type Dataset = Feature<"Dataset">;
export type Distribution = Feature<"Distribution">;
export type Service = Feature<ServiceProtocol>;

// #endregion

// #region Specific types
export interface Language {
  code: string;
  dir: string;
  name: string;
  alternate?: string;
}

export interface Link {
  href: string;
  rel: string;
  type?: string;
  title?: string;
}

export interface LinkVariable {
  type: string;
  description: string;
  format?: string;
  default?: string | number;
  enum?: (string | number)[];
}

export interface TemplateLink {
  uriTemplate: string;
  type: string;
  variables: Record<string, LinkVariable>;
  title: string;
  rel: string;
}

export interface Property<recordType extends string> {
  title: string;
  shortTitle?: string;
  type: recordType;
  // TODO maybe we'll have to split this away to a "service property"
  protocol?: ServiceProtocol;
  metaInformation?: boolean;
  attribution?: string;
  externalIds?: string[];
  contacts?: Contact[];
  language?: Language;
  languages?: Language[];
  description?: string;
  // TODO maybe this is only available in the Dataset props
  preferredDistributionId?: string;
  // Combines the data of several providers, e.g. the KGK datasets.
  aggregated?: boolean;
}

export interface Contact {
  // `role` and `country`: older record shape, still read by the catalog.
  country?: string;
  role?: string;
  organization: string;
  roles?: string[];
  phones?: { value: string; roles?: string[] }[];
  emails?: { value: string }[];
  links?: { href: string }[];
}

export type ServiceProtocol =
  | "ogc:wmts"
  | "ogc:wms"
  | "ogc:geojson"
  | "ogcapi:stac";
