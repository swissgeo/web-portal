import type { Page, Publication } from "@swissgeo/content";

import { createError, getRouterParam } from "h3";

export default defineEventHandler(async (event): Promise<Page> => {
  const documentId = getRouterParam(event, "documentId");
  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing Livingdocs document ID",
    });
  }

  const publication = await livingdocsFetch<Publication>(
    getLivingdocsDocumentPath(documentId),
  );

  const resolvedPublication = await resolveLivingdocsTeasers(publication);
  return {
    ...resolvedPublication,
    languageReferences: [],
  };
});
