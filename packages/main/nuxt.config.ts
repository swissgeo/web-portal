// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from "node:child_process";

function getGitCommit() {
  try {
    return (
      process.env.GIT_COMMIT ??
      execSync("git rev-parse --short HEAD").toString().trim()
    );
  } catch {
    // git not available at build time
    return "unknown";
  }
}

function getVersion() {
  return process.env.VERSION ?? getGitCommit();
}

const buildTime = new Date().toISOString();
// NUXT always force NODE_ENV to production so we cannot use it to make a development build with
// source map, therefore using our own DEVELOPMENT_BUILD environment variable
const isDevelopment = process.env.DEVELOPMENT_BUILD === "1";
process.env.NODE_ENV = isDevelopment ? "dev" : process.env.NODE_ENV;

export default defineNuxtConfig({
  app: {
    buildAssetsDir: "/_nxt/",
    keepalive: true,
  },
  typescript: {
    tsConfig: {
      include: ["**/__tests__/**/*"],
    },
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: isDevelopment },
  dev: isDevelopment,
  build: {
    transpile: [],
  },
  modules: [
    "@nuxt/eslint",
    "@nuxt/test-utils",
    "@nuxt/test-utils/module",
    "@pinia/nuxt",
    "@nuxtjs/i18n",
    "@nuxt/ui",
  ],
  css: ["~/assets/css/main.css"],
  ui: {
    experimental: {
      componentDetection: ["LocaleSelect"],
    },
    colorMode: false,
  },
  sourcemap: {
    // Enable in dev, disable in prod (unless you have a private uploader)
    server: isDevelopment,
    client: isDevelopment,
  },
  vite: {
    build: {
      minify: isDevelopment ? false : "terser",
      sourcemap: isDevelopment,
    },
    mode: isDevelopment ? "development" : "production",
    server: {
      // disable hot module reload in tests
      hmr: process.env.NODE_ENV === "test" ? false : true,
    },
    plugins: [
      {
        /**
         * Dirty fix due to the migration to Vite 8
         * See https://github.com/nuxt-modules/i18n/issues/3949
         * As well as https://github.com/nuxt-modules/i18n/issues/3953#issuecomment-4187681431 where this workaround is proposed
         * TODO: Investigate if this can be removed once the i18n module is updated to support Vite 8
         */
        name: "i18n-json-vite8-fix",
        enforce: "pre",
        configResolved(config) {
          const jsonPlugin = config.plugins.find((p) => p.name === "vite:json");
          if (!jsonPlugin?.transform) {
            return;
          }

          const originalTransform =
            typeof jsonPlugin.transform === "function"
              ? jsonPlugin.transform
              : jsonPlugin.transform?.handler;
          if (!originalTransform) {
            return;
          }

          const patchedTransform = function (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this: any,
            code: string,
            id: string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...args: any[]
          ) {
            // Skip i18n locale JSON files, let unplugin-vue-i18n handle them
            if (/i18n\/locales\/.*\.json$/.test(id)) {
              return;
            }
            return originalTransform.call(this, code, id, ...args);
          };

          if (typeof jsonPlugin.transform === "function") {
            jsonPlugin.transform = patchedTransform;
          } else if (jsonPlugin.transform?.handler) {
            jsonPlugin.transform.handler = patchedTransform;
          }
        },
      },
    ],
  },
  i18n: {
    // Disable automatic browser-language detection to prevent the i18n middleware
    // from redirecting unprefixed paths to locale roots reserved for the CMS.
    detectBrowserLanguage: false,
    // All locales use a prefix (/de/map, /fr/map, …) so routing is symmetric.
    // /map and / are handled by the redirectLocale middleware
    // which redirects to /<lang>/map based on the browser Accept-Language.
    strategy: "prefix",
    langDir: "locales",
    locales: [
      {
        code: "de",
        name: "Deutsch",
        file: "de.json",
      },
      {
        code: "fr",
        name: "Français",
        file: "fr.json",
      },
      {
        code: "en",
        name: "English",
        file: "en.json",
      },
      {
        code: "it",
        name: "Italiano",
        file: "it.json",
      },
      {
        code: "rm",
        name: "Rumantsch",
        file: "rm.json",
      },
    ],
    defaultLocale: "de",
  },
  runtimeConfig: {
    what3wordsApiKey: "",
    geoadminApiBaseUrl: "",
    shareServiceUrl: "https://www.dev.sgdi.tech/api/wps/v1/state",
    public: {
      ogcApiEndpoint: "",
      gitCommit: getGitCommit(),
      version: getVersion(),
      buildTime,
      wantedLogLevels: "error,warn",
    },
  },
  nitro: {
    ignore: ["**/__tests__/**"],
  },
  routeRules: {
    // cache the rendered pages for 2 minutes
    //'/content/**': { cache: { maxAge: process.dev ? 1 : 120 } },
    //'/api/wpa/v1/**': { cache: { maxAge: process.dev ? 1 : 30 } },
  },
  icon: {
    localApiEndpoint: "/api/wpa/v1/icons",
  },
});
