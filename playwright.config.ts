import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    // Dev-mode Vite cold compile plus OpenLayers hydration needs a generous
    // per-test budget when running locally against `pnpm run dev`. In CI we
    // run against a production preview which is much faster.
    timeout: 120_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { open: 'never' }], ['list']],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
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
