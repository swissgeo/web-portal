import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveEnvironment, useEnvironment } from "../useEnvironment";

const { runtimeConfigMock } = vi.hoisted(() => ({
  runtimeConfigMock: { public: { testSiteBanner: "" } },
}));

mockNuxtImport("useRuntimeConfig", () => () => runtimeConfigMock);

describe("resolveEnvironment", () => {
  it("reports local dev, regardless of the banner", () => {
    expect(resolveEnvironment("", true)).toBe("local");
    expect(resolveEnvironment("dev", true)).toBe("local");
    expect(resolveEnvironment("int", true)).toBe("local");
  });

  it("maps the deployed test site banner values", () => {
    expect(resolveEnvironment("dev", false)).toBe("dev");
    expect(resolveEnvironment("int", false)).toBe("int");
    expect(resolveEnvironment("preview", false)).toBe("preview");
  });

  it("resolves the empty production default to prod", () => {
    expect(resolveEnvironment("", false)).toBe("prod");
  });

  it("fails closed to prod on unknown banner values", () => {
    expect(resolveEnvironment("production", false)).toBe("prod");
    expect(resolveEnvironment("Dev", false)).toBe("prod");
    expect(resolveEnvironment("garbage", false)).toBe("prod");
  });
});

// `import.meta.dev` is falsy under Vitest (mirroring a production build),
// so the composable resolves through the deployed branch here. The local
// branch is covered by resolveEnvironment above.
describe("useEnvironment", () => {
  beforeEach(() => {
    runtimeConfigMock.public = { testSiteBanner: "" };
  });

  it("reads the test site banner from the runtime config", () => {
    expect(useEnvironment().environment).toBe("prod");
    runtimeConfigMock.public = { testSiteBanner: "int" };
    expect(useEnvironment().environment).toBe("int");
  });

  it("enables debug tools on dev and preview, not on int or prod", () => {
    expect(useEnvironment().isDebugToolsEnabled).toBe(false);
    runtimeConfigMock.public = { testSiteBanner: "int" };
    expect(useEnvironment().isDebugToolsEnabled).toBe(false);
    runtimeConfigMock.public = { testSiteBanner: "dev" };
    expect(useEnvironment().isDebugToolsEnabled).toBe(true);
    runtimeConfigMock.public = { testSiteBanner: "preview" };
    expect(useEnvironment().isDebugToolsEnabled).toBe(true);
  });

  it("marks only the deployed test sites as non-production", () => {
    expect(useEnvironment().isTestSite).toBe(false);
    expect(useEnvironment().isProduction).toBe(true);
    runtimeConfigMock.public = { testSiteBanner: "dev" };
    expect(useEnvironment().isTestSite).toBe(true);
    expect(useEnvironment().isProduction).toBe(false);
  });

  it("never reports local dev for deployed environments", () => {
    expect(useEnvironment().isLocalDev).toBe(false);
    runtimeConfigMock.public = { testSiteBanner: "dev" };
    expect(useEnvironment().isLocalDev).toBe(false);
  });
});
