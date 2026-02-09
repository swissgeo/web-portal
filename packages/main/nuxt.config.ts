// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vueDevTools from 'vite-plugin-vue-devtools'

import { Swissgeo } from './stylePreset.js'
import primevueColorVars from './vite-plugin-primevue-tailwind.js'

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
        '@primevue/nuxt-module',
        [
            '@nuxtjs/google-fonts',
            {
                families: {
                    Inter: {},
                },
            },
        ],
    ],
    primevue: {
        options: {
            theme: {
                preset: Swissgeo,
                options: {
                    // explicitly setting the dark mode toggle class
                    // so that the browser preference isn't taken into account
                    darkModeSelector: '.dark-mode',
                    cssLayer: {
                        name: 'primevue',
                        order: 'theme, base, primevue, custom',
                    },
                },
            },
        },
    },
    css: ['~/assets/css/main.css'],
    sourcemap: {
        server: true,
        client: true,
    },
    vite: {
        plugins: [
            primevueColorVars({
                presetPath: './stylePreset.js',
            }),

            tailwindcss(),
            vueDevTools(),
            nodePolyfills(),
        ],
        resolve: {
            alias: {
                '@geonetwork-ui': fileURLToPath(new URL('./geonetwork-ui', import.meta.url)),
            },
        },
        preserveSymlinks: true, // VERY important in monorepos
    },
    i18n: {
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'selectedLanguage',
            redirectOn: 'root', // only redirect on root path
        },
        strategy: 'no_prefix', // don't do route paths
        lazy: true,
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
        public: {
            ogcApiEndpoint: '',
            overlayId: '',
            aboutMenu: { id: 199, translationKey: 'menuTitles.about' },
            knowledgeMenu: { id: 200, translationKey: 'menuTitles.knowledge' },
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
