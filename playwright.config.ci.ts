import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/integration',
    // Default expect() timeout. 15s is enough for prod preview hydration;
    // the HYDRATION_TIMEOUT guard in the spec file covers dev-mode cold starts.
    expect: { timeout: 15_000 },
    fullyParallel: true,
    forbidOnly: true,
    retries: 2,
    workers: undefined,
    reporter: [['junit', { open: 'never' }], ['list']],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        // First-page hydration (especially the OL map) needs more than the
        // 5s default. 15s is enough for prod preview and leaves the 60s
        // hydration guard as a fallback for dev-mode cold starts.
        actionTimeout: 15_000,
        screenshot: 'only-on-failure',
        video: 'retry-with-video',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
})
