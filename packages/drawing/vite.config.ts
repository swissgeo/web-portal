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
            minify: mode === 'development' ? false : true,
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                fileName: (format) => `index.${format}.js`,
                name: '@swissgeo/drawing',
            },
            rollupOptions: {
                external: ['vue', 'pinia', '@swissgeo/layers', '@swissgeo/log', 'ol', 'lucide-vue-next'],
                output: {
                    exports: 'named',
                },
            },
            sourcemap: true,
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
                '~': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        plugins: [
            tsconfigPaths(),
            vue(),
            AutoImport({
                dirs: ['./src/**'],
                imports: [
                    'vue',
                    'vue-router',
                    'vue-i18n',
                    'pinia',
                ],
                eslintrc: {
                    enabled: true,
                    filepath: '.output/eslintrc-auto-import.json',
                },
                dts: './.output/auto-imports.d.ts',
                vueTemplate: true,
            }),
            dts({
                bundleTypes: true,
                processor: 'vue',
            }),
        ],
    }
})
