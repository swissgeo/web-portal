import type { ContentPageSearchResponse } from "@swissgeo/search";

import { createError, getQuery } from "h3";

import {
  livingdocsFetch,
  resolveLivingdocsLanguage,
} from "../../../../utils/livingdocs";

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 10;
// Hard cap imposed by the Livingdocs publications search endpoint.
const MAX_LIMIT = 100;
/**
 * Only actual pages are searched. The tenant also publishes `glossary-entry`
 * and `link` documents, which have no slug and no route of their own - without
 * this filter they drown the pages out (86 of the first 100 hits for "geo").
 * Passing the parameter empty returns nothing at all, so it is always set.
 */
const CONTENT_TYPE = "content-page";

interface LivingdocsPublicationSummary {
  systemdata?: { documentId?: number };
  metadata?: {
    title?: string;
    description?: string;
    slug?: string;
    language?: { locale?: string };
  };
}

/**
 * The endpoint returned a bare array before API version `2026-01` and
 * `{ results, total, cursor }` from it on. The version is part of
 * `livingdocsApiEndpoint`, so both shapes are accepted here.
 */
type LivingdocsSearchResponse =
  | LivingdocsPublicationSummary[]
  | { results?: LivingdocsPublicationSummary[] };

export default defineEventHandler(
  async (event): Promise<ContentPageSearchResponse> => {
    const { q, lang, limit } = getQuery(event);

    const search = typeof q === "string" ? q.trim() : "";
    if (search.length < MIN_QUERY_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: `Query parameter \`q\` must be at least ${MIN_QUERY_LENGTH} characters long`,
      });
    }

    const parsedLimit = Number(limit ?? DEFAULT_LIMIT);
    const clampedLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.trunc(parsedLimit), 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const response = await livingdocsFetch<LivingdocsSearchResponse>(
      "publications/search",
      {
        search,
        languages: resolveLivingdocsLanguage(
          typeof lang === "string" ? lang : undefined,
        ),
        limit: clampedLimit,
        contentTypes: CONTENT_TYPE,
        fields: "systemdata,metadata",
      },
    );

    const publications = Array.isArray(response)
      ? response
      : (response.results ?? []);

    return {
      results: publications.flatMap((publication) => {
        const documentId = publication.systemdata?.documentId;
        const title = publication.metadata?.title;
        if (documentId === undefined || !title) {
          return [];
        }

        return [
          {
            documentId: String(documentId),
            title,
            description: publication.metadata?.description ?? "",
            slug: publication.metadata?.slug ?? "",
            locale: publication.metadata?.language?.locale ?? "",
          },
        ];
      }),
    };
  },
);
