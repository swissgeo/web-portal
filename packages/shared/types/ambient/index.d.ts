/* eslint-disable @typescript-eslint/consistent-type-imports */
// trying to make some globally available things from nuxt known
// to the subpackages
export interface RuntimeConfig {
  public: {
    ogcApiEndpoint: string;
    gitCommit: string;
    version: string;
    buildTime: string;
  };
}

declare global {
  const useRuntimeConfig: typeof import("nuxt").useRuntimeConfig;
  const useFetch: typeof import("nuxt").useFetch;
  const $fetch: typeof import("nuxt").$fetch;
}
