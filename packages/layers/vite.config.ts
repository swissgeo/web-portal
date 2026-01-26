import type { UserConfig } from 'vite'

import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'unplugin-dts/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }): UserConfig => {
    return {
        build: {
            // don't minify in dev build. This helps with debugging
            // maybe this could be solved in a better way with sourcemap?
            minify: mode === 'development' ? false : true,
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                fileName: (format) => `index.${format}.js`,
                name: '@swissgeo/layers',
            },
            rollupOptions: {
                external: ['vue', 'pinia'],
                output: {
                    exports: 'named',
                    globals: {
                        vue: 'Vue',
                    },
                },
            },
            sourcemap: true,
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        plugins: [
            AutoImport({
                dirs: ['./src/**'],
                imports: [
                    // Presets
                    'vue',
                    'vue-router',
                    'vue-i18n',
                    'pinia',
                ],
                // Automatically generate types
                dts: './.output/auto-imports.d.ts',
                // Auto import inside Vue template
                vueTemplate: true,
            }),
            dts({
                bundleTypes: true,
                processor: 'vue',
            }),
            tsconfigPaths(),
            vue(),
        ],
    }
})
