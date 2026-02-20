import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'unplugin-dts/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { getBaseBuildConfig } from '../../base.vite.config'

export default defineConfig(({ mode }) => {
    return {
        test: {
            globals: true,
            environment: 'jsdom',
            resolve: {
                alias: {
                    '@': [
                        fileURLToPath(new URL('./src', import.meta.url)),
                        fileURLToPath(new URL('../skeleton/src', import.meta.url)),
                    ],
                    '@stores': [
                        fileURLToPath(new URL('./src/stores', import.meta.url)),
                        fileURLToPath(new URL('../skeleton/src/stores', import.meta.url)),
                    ],
                    '~': fileURLToPath(new URL('../main/app', import.meta.url)),
                },
            },
        },
        build: {
            ...getBaseBuildConfig(mode),
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                fileName: (format) => `index.${format}.js`,
                name: '@swissgeo/map',
            },
            rollupOptions: {
                external: ['vue', 'pinia', '@swissgeo/drawing', 'lucide-vue-next'],
                output: {
                    exports: 'named',
                    globals: {
                        vue: 'Vue',
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
                '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
                '~': fileURLToPath(new URL('../main/app', import.meta.url)),
            },
        },
        plugins: [
            tsconfigPaths(),
            vue(),
            AutoImport({
                dirs: ['./src/**'],
                imports: [
                    // Presets
                    'vue',
                    'vue-i18n',
                    'pinia',
                ],
                eslintrc: {
                    enabled: true,
                    filepath: '.output/eslintrc-auto-import.json',
                },
                // Automatically generate types
                dts: './.output/auto-imports.d.ts',
                // Auto import inside Vue template
                vueTemplate: true,
            }),
            dts({
                bundleTypes: true,
                processor: 'vue',
            }),
        ],
    }
})
