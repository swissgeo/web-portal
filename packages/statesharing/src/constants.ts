// this is the current version of the app to be used in the state sharing
export const APP_STATE_CONFIG_VERSION: string = "1.0";

// The semver check for the validation of app states
export const APP_STATE_CONFIG_CONSTRAINT: string = "^1.0.0";

// Base URL of the app state sharing service, can be overridden by setting the NUXT_SHARE_SERVICE_URL environment variable
export const APP_STATE_SERVICE_BASE_URL: string =
  process.env.NUXT_SHARE_SERVICE_URL ??
  "https://www.dev.sgdi.tech/api/wps/v1/state";
