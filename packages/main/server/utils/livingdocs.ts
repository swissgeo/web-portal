import type { Publication } from "@swissgeo/content";

import { useRuntimeConfig } from "#imports";
import { createError } from "h3";
import { joinURL } from "ufo";

export const getLivingdocsDocumentPath = (documentId: string) => {
  if (!/^[A-Za-z0-9_-]+$/.test(documentId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Livingdocs document ID",
    });
  }

  return joinURL(
    "documents",
    encodeURIComponent(documentId),
    "latestPublication",
  );
};

export const livingdocsFetch = async <T>(path: string): Promise<T> => {
  const config = useRuntimeConfig();
  const apiEndpoint = config.livingdocsApiEndpoint.trim();
  const authToken = config.livingdocsAuthToken.trim();

  if (!apiEndpoint || !authToken) {
    throw createError({
      statusCode: 503,
      statusMessage: "Livingdocs proof of concept is not configured",
    });
  }

  try {
    return await $fetch<T>(joinURL(apiEndpoint, path), {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "Livingdocs request failed",
    });
  }
};

type CmsComponent = {
  component?: string;
  content?: Record<string, unknown>;
  containers?: Record<string, unknown[]>;
};

type ResolvedTeaserImage = NonNullable<ResolvedTeaserData["image"]>;

type ResolvedTeaserData = {
  documentId: number;
  title: string;
  description: string;
  href: string;
  image?: {
    name: string;
    url: string;
    srcSet?: Array<{
      width: number;
      url: string;
    }>;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isDefinedString = (value: string | undefined): value is string => {
  return typeof value === "string";
};

const isCmsComponent = (value: unknown): value is CmsComponent => {
  if (!isRecord(value)) {
    return false;
  }

  return value.component === undefined || typeof value.component === "string";
};

const findTeaserItems = (items: unknown[]): CmsComponent[] => {
  const teaserItems: CmsComponent[] = [];

  for (const item of items) {
    if (!isCmsComponent(item)) {
      continue;
    }

    if (item.component === "teaser-item") {
      teaserItems.push(item);
    }

    for (const children of Object.values(item.containers ?? {})) {
      teaserItems.push(...findTeaserItems(children));
    }
  }

  return teaserItems;
};

const getTeaserDocumentId = (item: CmsComponent): string | undefined => {
  const teaser = item.content?.teaser;
  if (!isRecord(teaser) || !isRecord(teaser.params)) {
    return;
  }

  const teaserReference = teaser.params.teaser;
  if (!isRecord(teaserReference) || !isRecord(teaserReference.reference)) {
    return;
  }

  const documentId = teaserReference.reference.id;
  return typeof documentId === "string" ? documentId : undefined;
};

const getTeaserImage = (value: unknown): ResolvedTeaserImage | undefined => {
  if (!isRecord(value) || !Array.isArray(value.crops)) {
    return;
  }

  for (const crop of value.crops) {
    if (
      !isRecord(crop) ||
      crop.name !== "16:9" ||
      typeof crop.url !== "string"
    ) {
      continue;
    }

    const srcSet = Array.isArray(crop.srcSet)
      ? crop.srcSet.flatMap((source) => {
          if (
            !isRecord(source) ||
            typeof source.width !== "number" ||
            typeof source.url !== "string"
          ) {
            return [];
          }

          return [{ width: source.width, url: source.url }];
        })
      : undefined;

    return {
      name: crop.name,
      url: crop.url,
      srcSet,
    };
  }
};

const toResolvedTeaser = (
  publication: Publication,
): ResolvedTeaserData | null => {
  const metadata: unknown = publication.metadata;
  if (
    !isRecord(metadata) ||
    typeof metadata.title !== "string" ||
    typeof metadata.description !== "string" ||
    !isRecord(metadata.language) ||
    typeof metadata.language.locale !== "string"
  ) {
    return null;
  }

  return {
    documentId: publication.systemdata.documentId,
    title: metadata.title,
    description: metadata.description,
    href: `/${metadata.language.locale}/cms/${publication.systemdata.documentId}`,
    image: getTeaserImage(metadata.teaserImage),
  };
};

export const resolveLivingdocsTeasers = async (
  publication: Publication,
): Promise<Publication> => {
  const teaserItems = findTeaserItems(publication.content);
  const documentIds = [
    ...new Set(teaserItems.map(getTeaserDocumentId).filter(isDefinedString)),
  ];
  const teasers = new Map<string, ResolvedTeaserData>();

  await Promise.all(
    documentIds.map(async (documentId) => {
      const teaserPublication = await livingdocsFetch<Publication>(
        getLivingdocsDocumentPath(documentId),
      );
      const teaser = toResolvedTeaser(teaserPublication);
      if (teaser) {
        teasers.set(documentId, teaser);
      }
    }),
  );

  for (const item of teaserItems) {
    const documentId = getTeaserDocumentId(item);
    const teaser = documentId ? teasers.get(documentId) : undefined;
    if (teaser) {
      item.content = { ...item.content, resolvedTeaser: teaser };
    }
  }

  return publication;
};
