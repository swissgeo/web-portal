import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'unplugin-dts/vite'
import AutoImportComponents from 'unplugin-vue-components/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig, UserConfigFnObject, type UserConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const config: UserConfigFnObject = defineConfig(({ mode }) => {
    return {
        build: {
            // don't minify in dev build. This helps with debugging
            // maybe this could be solved in a better way with sourcemap?
            minify: mode === 'development' ? false : true,
            lib: {
                entry: resolve(__dirname, 'src/'),
                // entry: {
                //     api: resolve(__dirname, 'types/api/index.ts'),
                //     livingdocs: resolve(__dirname, 'types/livingdocs/index.ts'),
                // },
                // fileName: (format) => `index.${format}.js`,
                formats: ['es'],
                name: '@swissgeo/content',
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
            },
        },
        plugins: [

            // AutoImport({
            //     dirs: ['./src/**'],
            //     imports: [
            //         // Presets
            //         'vue',
            //         'vue-router',
            //         'vue-i18n',
            //         'pinia',
            //         '@vueuse/core',
            //         'vee-validate',
            //     ],
            //     // Automatically generate types
            //     dts: '.nuxt/auto-imports.d.ts',
            //     // Auto import inside Vue template
            //     vueTemplate: true,
            // }),
            // AutoImportComponents({
            //     dts: './.nuxt/auto-components.d.ts',
            //     dirs: ['./src/**'],
            // }),
            vue(),
            dts({
                bundleTypes: true,
                processor: "vue"
            }),
            tsconfigPaths(),
        ],
    }
})

export default config
