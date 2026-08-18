import type { Publication } from "@swissgeo/content";

import { createError, getRouterParam } from "h3";

export default defineEventHandler(async (event): Promise<Publication> => {
  const documentId = getRouterParam(event, "documentId");
  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing Livingdocs menu document ID",
    });
  }

  return livingdocsFetch<Publication>(getLivingdocsDocumentPath(documentId));
});
