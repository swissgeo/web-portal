// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vueDevTools from 'vite-plugin-vue-devtools'

function getGitCommit() {
    try {
        return process.env.GIT_COMMIT ?? execSync('git rev-parse --short HEAD').toString().trim()
    } catch {
        // git not available at build time
        return 'unknown'
    }
}

function getVersion() {
    return process.env.VERSION ?? getGitCommit()
}

const buildTime = new Date().toISOString()
// NUXT always force NODE_ENV to production so we cannot use it to make a development build with
// source map, therefore using our own DEVELOPMENT_BUILD environment variable
const isDevelopment = process.env.DEVELOPMENT_BUILD === '1'
process.env.NODE_ENV = isDevelopment ? 'dev' : process.env.NODE_ENV

export default defineNuxtConfig({
    app: {
        buildAssetsDir: '/_nxt/',
        keepalive: true,
    },
    typescript: {
        tsConfig: {
            include: ['**/__tests__/**/*'],
        },
    },
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    dev: isDevelopment,
    build: {
        transpile: [],
    },
    modules: [
        '@nuxt/eslint',
        '@nuxt/image',
        '@nuxt/test-utils',
        '@nuxt/test-utils/module',
        '@pinia/nuxt',
        '@nuxtjs/i18n',
        '@nuxt/ui',
    ],
    css: ['~/assets/css/main.css'],
    ui: {
        experimental: {
            componentDetection: ['LocaleSelect'],
        },
        colorMode: false,
    },
    sourcemap: {
        // Enable in dev, disable in prod (unless you have a private uploader)
        server: isDevelopment,
        client: isDevelopment,
    },
    vite: {
        plugins: [vueDevTools() as never, nodePolyfills() as never],
        build: {
            minify: isDevelopment ? false : 'terser',
            sourcemap: isDevelopment,
        },
        mode: isDevelopment ? 'development' : 'production',
        server: {
            // disable hot module reload in tests
            hmr: process.env.NODE_ENV === 'test' ? false : true,
        },
    },
    i18n: {
        // Disable automatic browser-language detection to prevent the i18n middleware
        // from redirecting unprefixed paths to locale roots reserved for the CMS.
        detectBrowserLanguage: false,
        // All locales use a prefix (/de/map, /fr/map, …) so routing is symmetric.
        // /map and / are handled by the redirectLocale middleware
        // which redirect to /<lang>/map based on the i18n_redirected cookie.
        strategy: 'prefix',
        langDir: 'locales',
        locales: [
            {
                code: 'de',
                name: 'Deutsch',
                file: 'de.json',
            },
            {
                code: 'fr',
                name: 'Français',
                file: 'fr.json',
            },
            {
                code: 'en',
                name: 'English',
                file: 'en.json',
            },
            {
                code: 'it',
                name: 'Italiano',
                file: 'it.json',
            },
            {
                code: 'rm',
                name: 'Rumantsch',
                file: 'rm.json',
            },
        ],
        defaultLocale: 'de',
    },
    runtimeConfig: {
        what3wordsApiKey: '',
        geoadminApiBaseUrl: '',
        public: {
            ogcApiEndpoint: '',
            gitCommit: getGitCommit(),
            version: getVersion(),
            buildTime,
            wantedLogLevels: 'error,warn',
            shareServiceUrl: 'http://localhost:3010',
        },
    },
    nitro: {
        ignore: ['**/__tests__/**'],
    },
    routeRules: {
        // cache the rendered pages for 2 minutes
        //'/content/**': { cache: { maxAge: process.dev ? 1 : 120 } },
        //'/api/wpa/v1/**': { cache: { maxAge: process.dev ? 1 : 30 } },
    },
    icon: {
        localApiEndpoint: '/api/wpa/v1/icons',
    },
})
