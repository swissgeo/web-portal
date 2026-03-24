import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
    test: {
        // running the tests in the happy-dom environment by default, to not have
        // too much overhead in the tests
        // if the nuxt instance is needed, you can enable that with
        // @vitest-environment nuxt
        // on the top of a file
        environment: 'happy-dom',
        hookTimeout: 5000,
    },
})
