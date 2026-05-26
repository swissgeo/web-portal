import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/integration",
  retries: 1,
  workers: undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // First-page hydration (especially the OL map) needs more than the
    // 5s default. 15s is enough for prod preview and leaves the 60s
    // hydration guard as a fallback for dev-mode cold starts.
    actionTimeout: 15_000,
    screenshot: "only-on-failure",
    video: "retry-with-video",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      // env for the playwright running
      // for the CI the same is used via .env.test
      NODE_ENV: "test",
      NUXT_PUBLIC_OGC_API_ENDPOINT: "http://mock-oar.org/api/oar",
      NUXT_PUBLIC_API_ENDPOINT: "http://mock-livingdocs.org/",
    },
  },
});
