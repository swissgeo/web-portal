import type { Owner } from "@swissgeo/ogc";

import { buildCatalogItemsUrl } from "@swissgeo/ogc";

const ORGANIZATIONS_COLLECTION = "swissgeo-organizations";
// Max `limit` of the backend. All organizations fit in one page.
const LIMIT = 100;

type OrganizationsResponse = {
  features: {
    id: string;
    properties: { name: string; acronym: string };
  }[];
};

/**
 * Loads the organizations that own datasets, in the current language and
 * sorted by acronym. Changing the language reloads them.
 */
export function useOrganizations() {
  const { locale } = useI18n();
  const { ogcApiEndpoint } = useRuntimeConfig().public;

  const { data, status } = useFetch(
    buildCatalogItemsUrl(ogcApiEndpoint, ORGANIZATIONS_COLLECTION),
    {
      query: { lang: locale, limit: LIMIT },
      transform: (response: OrganizationsResponse): Owner[] => {
        const collator = new Intl.Collator(locale.value, {
          sensitivity: "base",
        });
        return response.features
          .map(({ id, properties: { name, acronym } }) => ({
            id,
            name,
            acronym,
          }))
          .sort((a, b) => collator.compare(a.acronym, b.acronym));
      },
      // The catalog is only shown on demand, so it must not hold up the server rendering
      server: false,
      lazy: true,
    },
  );

  return { organizations: data, status };
}
