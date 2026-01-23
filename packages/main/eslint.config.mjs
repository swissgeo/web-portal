import defaultConfig from '@swissgeo/config-eslint'

import { globalIgnores } from 'eslint/config'

export default [
    ...defaultConfig,
    globalIgnores(['.nuxt', '.output']),
    {
        rules: {
            'vue/multi-word-component-names': [
                'error',
                {
                    ignores: ['default'],
                },
            ],
        },
    },
    {
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
]
