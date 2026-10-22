import { resolveTargetLocale } from "~~/server/utils/locale-resolution";
import { sendRedirect, setResponseHeader } from "h3";
// Intercept unlocalized entry-point requests before @nuxtjs/i18n's
// render:before hook does.
//
// With strategy: 'prefix', the i18n module unconditionally redirects `/` (and,
// during SSR, also `/map`) to `/<defaultLocale>/...` regardless of
// `detectBrowserLanguage: false` (see the generated `.nuxt/dev/index.mjs`,
// function resolveRedirectPath — there is a hard-coded fallback when
// strategy === 'prefix'). That short-circuits our Vue route middleware, so a
// user on a French browser would still be sent to `/de/map` when opening `/`
// or `/map` in a new tab.
//
// Running here as a Nitro server middleware means we redirect before any of
// the i18n hooks fire, using the same priority the Vue middleware uses for
// other unlocalized paths: Accept-Language → defaultLocale.

const ENTRY_PATHS = new Set(["/", "/map"]);
// Same value as URL_PARAM_STATE in app/composables/useUrlParams.ts.
const STATE_PARAM = "state";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  if (!ENTRY_PATHS.has(url.pathname)) {
    return;
  }

  const target = resolveTargetLocale(
    getRequestHeader(event, "accept-language"),
  );

  setResponseHeader(event, "Cache-Control", "no-store");
  // A share link (`/?state=…`) opens the map, not the landing page.
  const isShareLink = url.pathname === "/" && url.searchParams.has(STATE_PARAM);
  const path = isShareLink ? "/map" : url.pathname;
  await sendRedirect(event, `/${target}${path}${url.search}`, 302);
});
