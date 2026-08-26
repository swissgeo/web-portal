import log from "@swissgeo/log";
import { createError, getQuery } from "h3";
import { parse as parseYaml } from "yaml";

import type { Catalog } from "~/types/layerCatalog";

import { catalogFileSchema } from "~/types/layerCatalog";

/**
 * Serves the layer catalog of one locale, read from
 * `server/assets/layerCatalog/`. It is served rather than bundled so that the
 * client downloads the one catalog it shows instead of every translation of it.
 */

/** The locales the catalog has been translated into. */
const CATALOG_LOCALES = ["de", "en"] as const;

type CatalogLocale = (typeof CATALOG_LOCALES)[number];

/** Shown for the locales the catalog has not been translated into yet. */
const FALLBACK_LOCALE: CatalogLocale = "en";

function resolveCatalogLocale(lang: unknown): CatalogLocale {
  return CATALOG_LOCALES.includes(lang as CatalogLocale)
    ? (lang as CatalogLocale)
    : FALLBACK_LOCALE;
}

/**
 * Parsed catalogs, kept for the lifetime of the process: the files ship with
 * the server and cannot change under it.
 */
const catalogsByLocale = new Map<CatalogLocale, Catalog>();

async function loadCatalog(locale: CatalogLocale): Promise<Catalog> {
  const cached = catalogsByLocale.get(locale);
  if (cached) {
    return cached;
  }

  const source = await useStorage("assets:server").getItem<string>(
    `layerCatalog/${locale}.yaml`,
  );
  if (typeof source !== "string") {
    throw new Error(`No catalog file for locale "${locale}"`);
  }

  // Validated on read rather than trusted: a hand-edited catalog is the kind of
  // file that goes wrong, and failing here beats rendering a broken tree.
  const catalog = catalogFileSchema.parse(parseYaml(source)).items;
  catalogsByLocale.set(locale, catalog);
  return catalog;
}

export default defineEventHandler(async (event) => {
  const { lang } = getQuery(event);
  const locale = resolveCatalogLocale(lang);

  try {
    return await loadCatalog(locale);
  } catch (error) {
    log.error(`Failed to load the ${locale} layer catalog: ${String(error)}`);
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading the layer catalog",
    });
  }
});
