import type { Paragraph } from "./Paragraph";
import type { TitleComponent } from "./Title";

export interface Publication {
  systemdata: Systemdata;
  metadata: ContentPageMetadata | MenuMetadata;
  content: ContentItem[];
  references?: Reference[];
}

export interface Design {
  name: string;
  version: string;
}

export interface Systemdata {
  version: number;
  projectId: number;
  channelId: number;
  documentId: number;
  contentType: string;
  documentType: string;
  title: string;
  publicationId: number;
  firstPublicationDate: string; // ISO date string
  lastPublicationDate: string; // ISO date string
  updatedAt: string; // ISO date string
  significantPublicationDate: string; // ISO date string
  visiblePublicationDate: string; // ISO date string
  design: Design;
  layout: string;
}

export interface ContentPageMetadata {
  language: {
    locale: string;
    groupId: string;
  };
  slug: string;
  twitterCard: string;
  openGraphType: string;
  seoRobots: string;
  title: string;
  twitterTitle: string;
  openGraphTitle: string;
  metaTitle: string;
  description: string;
  twitterDescription: string;
  openGraphDescription: string;
  metaDescription: string;
  teaserImage?: TeaserImage;
}

export interface MenuMetadata {
  open: boolean;
  name: string;
  type: string;
  tree: TreeItem[];
}

export interface Image {
  content: {
    image: string;
    caption: string;
  };
}

export interface TeaserImageSource {
  width: number;
  url: string;
}

export interface TeaserImageCrop {
  name: string;
  url: string;
  srcSet?: TeaserImageSource[];
}

export interface TeaserImage {
  url: string;
  crops?: TeaserImageCrop[];
}

export interface ResolvedTeaser {
  documentId: number;
  title: string;
  description: string;
  href: string;
  image?: TeaserImageCrop;
}

export interface Section {
  component: "section";
  identifier: string;
  id: string;
  containers: {
    section: ContentItem[];
  };
}

export type ContentItem =
  | TeaserContainer
  | TeaserItem
  | LeadContentPageWithCheckbox
  | Paragraph
  | Image
  | TitleComponent
  | Section;

export interface TeaserItem {
  component: "teaser-item";
  identifier: string;
  id: string;
  content: {
    teaser: {
      service: string;
      params: {
        teaser: {
          $ref: "document";
          reference: {
            id: string;
          };
        };
      };
    };
    resolvedTeaser?: ResolvedTeaser;
  };
}

export interface TeaserContainer {
  component: "teaser-container";
  identifier: string;
  id: string;
  styles?: {
    pageCardPresentation?: string;
  };
  content: {
    teaserTitle?: string;
  };
  containers: {
    teaserItems?: TeaserItem[];
    showAllLink?: ContentItem[];
  };
}

export interface LeadContentPageWithCheckbox {
  component: "lead-contentpage-with-checkbox";
  identifier: string;
  id: string;
  content: {
    publicationDateCheckbox: {
      service: string;
    };
  };
  containers: {
    "lead-contentpage-with-checkbox": (Paragraph | TitleComponent)[];
    section?: Section;
  };
}

export interface Reference {
  id: string;
  type?: string;
  location?: string;
  propertyName?: string;
}

export interface TreeItemTranslationItem {
  label: string;
  reference: {
    id: string;
  };
}

export interface TreeItem {
  id: string;
  type: string;
  items: TreeItem[];
  label?: string;
  reference?: Reference;
  translations?: Record<string, TreeItemTranslationItem>;
}
