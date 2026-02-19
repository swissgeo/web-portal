import { resolve } from 'node:path'
import dts from 'unplugin-dts/vite'
import { getBaseBuildConfig } from '../../base.vite.config'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
    plugins: [
        dts({
            entryRoot: 'src',
            insertTypesEntry: true,
        }),
    ],
    build: {
        ...getBaseBuildConfig(mode),
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
}))
