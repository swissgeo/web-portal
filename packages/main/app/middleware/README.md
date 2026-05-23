# App middleware

Global Nuxt route middleware that runs on every navigation.

## `redirect.global.ts`

Ensures every navigable URL ends up under a locale prefix (`/de`, `/fr`, `/en`, `/it`, `/rm`), and that the bare locale roots land on the map.

### Redirect table

| From                 | To                     |
| -------------------- | ---------------------- |
| `/`                  | `/<locale>/map`        |
| `/map`               | `/<locale>/map`        |
| `/<locale>`          | `/<locale>/map`        |
| `/<locale>/map`      | _no redirect_          |
| `/anything`          | `/<locale>/anything`   |
| `/<locale>/anything` | _no redirect_          |
| `/health`            | _no redirect (exempt)_ |

### Locale resolution for unlocalized paths

When the URL does not carry a locale, `resolvePreferredLocale()` picks one by:

1. Reading the request's `Accept-Language` header (server) or `navigator.languages` / `navigator.language` (client).
2. Returning the first tag that matches a configured i18n locale, via `pickLocaleFromAcceptLanguage` from `@swissgeo/shared`.
3. Falling back to the i18n `defaultLocale` (currently `de`) if no tag matches.

There is intentionally **no locale cookie**: the locale is derived from the URL on every request, and from the browser's `Accept-Language` only when the URL does not specify one. See ticket GPS-666 / PR #177 for the rationale.

### Why 302 (not 301)

The redirect target depends on `Accept-Language`, so browsers must not cache it permanently — otherwise a user whose browser language preference changes would still hit the previously cached locale.

### Production note: locale-root URLs

In production, `/de`, `/fr`, … are owned by the reverse proxy, which routes them to the CMS before Nuxt sees the request. The `isLocaleRoot` branch in `redirector` only fires when Nuxt is reached directly (dev, staging, or a proxy misconfiguration).

## Server-side counterpart

The same `Accept-Language`-based locale resolution is applied on initial entry by `packages/main/server/middleware/redirect-root.ts`, which uses `resolveTargetLocale` from `packages/main/server/utils/locale-resolution.ts`.
