import { useRuntimeConfig } from "#imports";
import { createError } from "h3";
import { joinURL } from "ufo";

/**
 * Languages the Livingdocs tenant on geoinformation.ch is set up for. The
 * portal ships five locales, so anything else falls back to German instead of
 * silently returning nothing.
 */
export const LIVINGDOCS_LANGUAGES = ["de", "fr"];

export const LIVINGDOCS_FALLBACK_LANGUAGE = "de";

export const resolveLivingdocsLanguage = (lang?: string): string => {
  if (lang && LIVINGDOCS_LANGUAGES.includes(lang)) {
    return lang;
  }
  return LIVINGDOCS_FALLBACK_LANGUAGE;
};

/**
 * Call the Livingdocs public API. The auth token is project-scoped and
 * server-only, so every CMS request has to go through Nitro.
 */
export const livingdocsFetch = async <T>(
  path: string,
  query?: Record<string, string | number>,
): Promise<T> => {
  const config = useRuntimeConfig();
  const apiEndpoint = config.livingdocsApiEndpoint.trim();
  const authToken = config.livingdocsAuthToken.trim();

  if (!apiEndpoint || !authToken) {
    throw createError({
      statusCode: 503,
      statusMessage: "Livingdocs is not configured",
    });
  }

  try {
    return await $fetch<T>(joinURL(apiEndpoint, path), {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      query,
    });
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "Livingdocs request failed",
    });
  }
};
