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
        build: {
            ...getBaseBuildConfig(mode),
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                fileName: (format) => `index.${format}.js`,
                name: '@swissgeo/timeslider',
            },
            rollupOptions: {
                external: ['vue', 'lucide-vue-next'],
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
            },
        },
        plugins: [
            tsconfigPaths(),
            vue(),
            AutoImport({
                dirs: ['./src/**'],
                imports: ['vue', 'vue-i18n'],
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
