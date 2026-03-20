// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
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
        typeCheck: false, //too much baggage ATM
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
        resolve: {
            alias: {
                '@geonetwork-ui': fileURLToPath(new URL('./geonetwork-ui', import.meta.url)),
            },
        },
        mode: isDevelopment ? 'development' : 'production',
    },
    i18n: {
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'selectedLanguage',
            // 'root' redirects only on '/'. Bare paths like '/map' (without a lang prefix)
            // will 404 — this is an intentional change; the app now requires a lang prefix.
            // Change to 'all' (and add any needed redirects) if backward-compatibility for '/map' is ever required.
            redirectOn: 'root',
        },
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
        // set these via .env file
        apiEndpoint: '',
        authToken: '',
        maptilerApiKey: '',
        public: {
            ogcApiEndpoint: '',
            overlayId: '',
            aboutMenu: { id: 199, translationKey: 'menuTitles.about' },
            knowledgeMenu: { id: 200, translationKey: 'menuTitles.knowledge' },
            gitCommit: getGitCommit(),
            version: getVersion(),
            buildTime,
        },
    },
    routeRules: {
        // cache the rendered pages for 2 minutes
        //'/content/**': { cache: { maxAge: process.dev ? 1 : 120 } },
        //'/api/v1/**': { cache: { maxAge: process.dev ? 1 : 30 } },
    },
})
