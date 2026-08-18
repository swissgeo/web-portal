const cmsDocumentIds = {
  home: {
    de: "1",
    fr: "689",
    it: "690",
    en: "691",
  },
  services: {
    de: "159",
    fr: "868",
    it: "869",
    en: "870",
  },
} as const;

export type CmsPage = keyof typeof cmsDocumentIds;

export const getCmsDocumentId = (page: CmsPage, locale: string): string => {
  const documents = cmsDocumentIds[page];
  if (locale in documents) {
    return documents[locale as keyof typeof documents];
  }

  return documents.de;
};
