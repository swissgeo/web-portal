import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/integration',
    // Dev-mode Vite cold compile plus OpenLayers hydration needs a generous
    // per-test budget when running locally against `pnpm run dev`. In CI we
    // run against a production preview which is much faster.
    timeout: 120_000,
    // Default expect() timeout. 15s is enough for prod preview hydration;
    // the HYDRATION_TIMEOUT guard in the spec file covers dev-mode cold starts.
    expect: { timeout: 15_000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { open: 'never' }], ['list']],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        // First-page hydration (especially the OL map) needs more than the
        // 5s default. 15s is enough for prod preview and leaves the 60s
        // hydration guard as a fallback for dev-mode cold starts.
        actionTimeout: 15_000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        // CI runs `pnpm build` as a dedicated step, then Playwright starts the
        // production preview server. Locally we keep `pnpm run dev` for HMR
        // while writing tests.
        command: process.env.CI ? 'pnpm --filter main preview' : 'pnpm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
})
