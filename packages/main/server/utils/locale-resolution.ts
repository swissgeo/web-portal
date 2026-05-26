import type { Lang } from "@swissgeo/shared";

import {
  DEFAULT_LOCALE,
  pickLocaleFromAcceptLanguage,
  VALID_LOCALES,
} from "@swissgeo/shared";

export { DEFAULT_LOCALE };

/**
 * Resolve the locale for an unlocalized request: Accept-Language → defaultLocale.
 */
export function resolveTargetLocale(acceptLanguage: string | undefined): Lang {
  return (
    pickLocaleFromAcceptLanguage(acceptLanguage, VALID_LOCALES) ??
    DEFAULT_LOCALE
  );
}
