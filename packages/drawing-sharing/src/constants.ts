// Base URL of the app drawing sharing service, can be overridden by setting the NUXT_PUBLIC_DRAW_SERVICE_URL environment variable
export const APP_DRAW_SERVICE_BASE_URL: string =
  process.env.NUXT_PUBLIC_DRAW_SERVICE_URL ??
  "https://www.dev.sgdi.tech/api/wps/v1/drawings";
