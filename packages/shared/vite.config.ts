import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'unplugin-dts/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig, UserConfigFnObject, type UserConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const config: UserConfigFnObject = defineConfig(({ mode }) => {
    return {
        build: {
            minify: false,
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                fileName: (format) => `index.${format}.js`,
                formats: ['es'],
                name: '@swissgeo/shared',
            },
            rollupOptions: {
                external: ['vue'],
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
                '~': fileURLToPath(new URL('./types', import.meta.url)),
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
                eslintrc: {
                    enabled: true,
                    filepath: '.output/eslintrc-auto-import.json',
                },
                // Automatically generate types
                dts: '.output/auto-imports.d.ts',
                // Auto import inside Vue template
                vueTemplate: true,
            }),
            dts({
                // entryRoot: 'src',
                // outDirs: 'dist',
                // rollupTypes: true,
                // insertTypesEntry: true, // adds dist/index.d.ts main entry
                entryRoot: 'types',
                insertTypesEntry: true,
                copyDtsFiles: true,
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

export default config
