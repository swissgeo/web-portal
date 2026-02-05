import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'unplugin-dts/vite'

export default defineConfig({
    plugins: [
        dts({
            entryRoot: 'src',
            insertTypesEntry: true,
        }),
    ],
    build: {
        minify: false,
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: (format) => `index.${format}.js`,
            name: '@swissgeo/search',
        },
        rollupOptions: {
            external: ['vue', '@swissgeo/shared'],
            output: {
                exports: 'named',
            },
        },
    },
})
