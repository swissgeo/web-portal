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
    resolve: {
        alias: {
            // h3 is a Nitro transitive dep not directly accessible in pnpm;
            // redirect to a lightweight stub so server utils/routes compile in tests.
            // h3: resolve(__dirname, '../../test-utils/h3-stub.ts'),
        },
    },
})
