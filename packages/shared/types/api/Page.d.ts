import type {
  ContentPageMetadata,
  Publication,
  Systemdata,
} from "../livingdocs/Publication";

export type LanguageReference = {
  metadata: ContentPageMetadata;
  systemdata: Systemdata;
};

export type Page = Publication & { languageReferences: LanguageReference[] };
