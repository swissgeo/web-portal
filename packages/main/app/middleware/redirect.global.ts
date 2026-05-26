import type { RouteLocationNormalized } from "vue-router";

import { DEFAULT_LOCALE, pickLocaleFromAcceptLanguage } from "@swissgeo/shared";

const SERVER_ROUTES = ["/api", "/health"];

export function isRootPath(path: string) {
  return path === "/";
}

/**
 * List of paths that should *not* be localized
 */
export function isExempt(path: string) {
  if (SERVER_ROUTES.some((prefix) => path.startsWith(prefix))) {
    return true;
  }
}

export function isLocaleRoot(path: string) {
  const { $i18n } = useNuxtApp();

  return $i18n.localeCodes.value.some(
    (code) => path === `/${code}` || path === `/${code}/`,
  );
}

export function isLocalized(path: string) {
  const { $i18n } = useNuxtApp();

  const pathParts = path.split("/");
  const firstPart = pathParts[1]; // the first element is an empty string

  return $i18n.localeCodes.value.some((code) => firstPart === code);
}

/**
 * Resolve the locale to use for a request that does not carry one in the URL.
 * Priority: browser Accept-Language → DEFAULT_LOCALE (shared with the Nitro
 * middleware so server and client agree on the fallback).
 */
export function resolvePreferredLocale(): string {
  const { $i18n } = useNuxtApp();
  const codes = $i18n.localeCodes.value as string[];

  // useRequestHeaders is populated on the server; on the client it returns {}.
  let acceptLanguage: string | undefined = useRequestHeaders([
    "accept-language",
  ])["accept-language"];
  if (!acceptLanguage && typeof navigator !== "undefined") {
    acceptLanguage = navigator.languages?.join(",") || navigator.language;
  }
  return pickLocaleFromAcceptLanguage(acceptLanguage, codes) ?? DEFAULT_LOCALE;
}

// 302 (not 301): the redirect target depends on Accept-Language, so browsers
// must not cache it permanently — otherwise a user whose browser language
// changes would still hit the previously cached locale.
export function redirector(
  to: Pick<RouteLocationNormalized, "path" | "query">,
) {
  const localePath = useLocalePath();

  if (isExempt(to.path)) {
    return undefined;
  } else if (isLocaleRoot(to.path)) {
    // The URL already specifies a locale; honor it and route to /<locale>/map.
    // Note: in production, locale-root URLs (`/de`, `/fr`, …) are owned by
    // the reverse proxy, which routes them to the CMS before Nuxt sees the
    // request. This branch only fires when Nuxt is reached directly (dev,
    // staging, or a proxy misconfiguration).
    return navigateTo(
      { path: localePath("/map"), query: to.query },
      { redirectCode: 302 },
    );
  } else if (isRootPath(to.path)) {
    const locale = resolvePreferredLocale();
    return navigateTo(
      { path: `/${locale}/map`, query: to.query },
      { redirectCode: 302 },
    );
  } else if (!isLocalized(to.path)) {
    // it's not localized, but is a specific path. We prepend the locale instead of redirecting to map
    const locale = resolvePreferredLocale();
    return navigateTo(
      { path: `/${locale}${to.path}`, query: to.query },
      { redirectCode: 302 },
    );
  }
}

/**
 * Redirect the user with following pattern:
 * * | /                  | /<locale>/map      |
 * * | /map               | /<locale>/map      |
 * * | /<locale>/map      | _no redirect_      |
 * * | /<locale>          | /<locale>/map      |
 * * | /anything          | /<locale>/anything |
 * * | /<locale>/anything | _no redirect_      |
 *
 * For unlocalized paths, the locale is resolved via browser Accept-Language →
 * DEFAULT_LOCALE (see {@link resolvePreferredLocale}).
 */
export default defineNuxtRouteMiddleware(redirector);
