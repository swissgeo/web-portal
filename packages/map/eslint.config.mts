import defaultConfig from '@swissgeo/config-eslint'
import autoGlobals from './.output/eslintrc-auto-import.json'

export default [
    ...defaultConfig,
    {
        languageOptions: {
            ...autoGlobals,
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
]
