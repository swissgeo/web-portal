import type { UserConfig } from 'vite'

import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'unplugin-dts/vite'
import { fileURLToPath, URL } from 'url'
import { getBaseBuildConfig } from '../../base.vite.config'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }): UserConfig => {
    return {
        build: {
            ...getBaseBuildConfig(mode),
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),

                fileName: (format) => `index.${format}.js`,
                name: '@swissgeo/ogc',
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
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
                '@types': fileURLToPath(new URL('./types', import.meta.url)),
            },
        },
        plugins: [
            tsconfigPaths(),
            vue(),
            AutoImport({
                dirs: ['./src/**'],
                imports: ['vue', 'pinia'],
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
