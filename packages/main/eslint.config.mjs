import defaultConfig from '@swissgeo/config-eslint'

import { globalIgnores } from 'eslint/config'

export default [
    ...defaultConfig,
    globalIgnores(['.nuxt', '.output', 'vite-plugin-primevue-tailwind.ts']),
    {
        rules: {
            'vue/multi-word-component-names': ['off'],
        },
    },
    {
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    project: ['./tsconfig.json'],
                },
            },
        },
    },
]
