// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vueDevTools from 'vite-plugin-vue-devtools'

let gitCommit = 'unknown'
try {
    gitCommit = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
    // git not available at build time
}

const buildTime = new Date().toISOString()

export default defineNuxtConfig({
    typescript: {
        typeCheck: false, //too much baggage ATM
    },
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
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
    },
    sourcemap: {
        // Enable in dev, disable in prod (unless you have a private uploader)
        server: process.env.NODE_ENV !== 'production',
        client: process.env.NODE_ENV !== 'production',
    },
    vite: {
        plugins: [vueDevTools() as never, nodePolyfills() as never],
        build: {
            minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
        },
        resolve: {
            alias: {
                '@geonetwork-ui': fileURLToPath(new URL('./geonetwork-ui', import.meta.url)),
            },
        },
    },
    i18n: {
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'selectedLanguage',
            redirectOn: 'root', // only redirect on root path
        },
        strategy: 'no_prefix', // don't do route paths
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
            gitCommit,
            buildTime,
        },
    },
    hooks: {
        // 'i18n:registerModule': (register) => {
        //     register({
        //         langDir: './app/locales',
        //         locales: [
        //             {
        //                 code: 'en',
        //                 file: 'en.json',
        //             },
        //             {
        //                 code: 'fr',
        //                 file: 'fr.json',
        //             },
        //             {
        //                 code: 'de',
        //                 file: 'de.json',
        //             },
        //         ],
        //     })
        // },
    },
    routeRules: {
        // cache the rendered pages for 2 minutes
        //'/content/**': { cache: { maxAge: process.dev ? 1 : 120 } },
        //'/api/v1/**': { cache: { maxAge: process.dev ? 1 : 30 } },
    },
})
