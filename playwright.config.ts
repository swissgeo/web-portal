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
      // The server does not start without these values, see server/plugins/validate-runtime-config.ts.
      NODE_ENV: "test",
      NUXT_PUBLIC_OGC_API_ENDPOINT: "http://oar.test/api/oar",
      NUXT_LIVINGDOCS_API_ENDPOINT: "http://livingdocs.test/",
      NUXT_GEOADMIN_API_BASE_URL: "http://geoadmin.test/rest/services",
      NUXT_REPORT_ISSUE_SERVICE_URL: "http://report-issue.test/api/feedback",
      NUXT_PUBLIC_REPORT_ISSUE_PORTAL_URL: "http://report-issue-portal.test",
      NUXT_PUBLIC_CMS_BASE_URL: "http://cms.test",
      NUXT_PUBLIC_ICON_SERVICE_ENDPOINT: "http://icons.test/api/icons/sets",
      NUXT_PUBLIC_DRAWING_SERVICE_ENDPOINT:
        "http://drawing.test/api/wps/v1/drawings",
      NUXT_PUBLIC_SHARE_SERVICE_URL: "http://share.test/api/wps/v1/state",
      NUXT_PUBLIC_PRINT_SERVICE_URL: "http://print.test/api/wps/v1/print/jobs",
      NUXT_PUBLIC_SEARCH_SERVICE_URL:
        "http://search.test/rest/services/ech/SearchServer",
      NUXT_PUBLIC_THESAURUS_SERVICE_URL: "http://thesaurus.test/api/thesauri",
      NUXT_PUBLIC_DRAWING_ALLOWED_DOMAINS: JSON.stringify(["drawing.test"]),
      NUXT_PUBLIC_FEATURE_FLAGS_ENABLE_CMS_SEARCH: "true",
      NUXT_PUBLIC_FEATURE_FLAGS_ENABLE_MOBILE_UI: "false",
    },
  },
});
