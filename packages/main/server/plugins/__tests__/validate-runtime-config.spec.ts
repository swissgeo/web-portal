import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);

function createValidConfig() {
  // unknown, so that tests can set values of the wrong type.
  const drawingAllowedDomains: unknown = ["drawings.example.test"];
  return {
    what3wordsApiKey: "",
    livingdocsAuthToken: "",
    geoadminApiBaseUrl: "https://api.example.test/rest/services",
    reportIssueServiceUrl: "https://report.example.test/feedback",
    livingdocsApiEndpoint: "https://cms-api.example.test",
    public: {
      ogcApiEndpoint: "https://ogc.example.test",
      cmsBaseUrl: "https://cms.example.test",
      iconServiceEndpoint: "https://icons.example.test/sets",
      drawingServiceEndpoint: "https://drawings.example.test",
      shareServiceUrl: "https://state.example.test",
      searchServiceUrl: "https://search.example.test",
      thesaurusServiceUrl: "https://thesauri.example.test",
      printServiceUrl: "https://print.example.test",
      drawingAllowedDomains,
    },
  };
}

let config = createValidConfig();

mockNuxtImport("useRuntimeConfig", () => () => config);

const { default: validateRuntimeConfig } =
  await import("../validate-runtime-config");

beforeEach(() => {
  config = createValidConfig();
});

describe("validate-runtime-config plugin", () => {
  it("accepts a complete configuration without the optional secrets", () => {
    expect(() => validateRuntimeConfig({} as never)).not.toThrow();
  });

  it.each`
    key                        | envName
    ${"geoadminApiBaseUrl"}    | ${"NUXT_GEOADMIN_API_BASE_URL"}
    ${"reportIssueServiceUrl"} | ${"NUXT_REPORT_ISSUE_SERVICE_URL"}
    ${"livingdocsApiEndpoint"} | ${"NUXT_LIVINGDOCS_API_ENDPOINT"}
  `("fails when the server key $key is empty", ({ key, envName }) => {
    Object.assign(config, { [key]: "" });

    expect(() => validateRuntimeConfig({} as never)).toThrow(envName);
  });

  it.each`
    key                         | envName
    ${"ogcApiEndpoint"}         | ${"NUXT_PUBLIC_OGC_API_ENDPOINT"}
    ${"cmsBaseUrl"}             | ${"NUXT_PUBLIC_CMS_BASE_URL"}
    ${"iconServiceEndpoint"}    | ${"NUXT_PUBLIC_ICON_SERVICE_ENDPOINT"}
    ${"drawingServiceEndpoint"} | ${"NUXT_PUBLIC_DRAWING_SERVICE_ENDPOINT"}
    ${"shareServiceUrl"}        | ${"NUXT_PUBLIC_SHARE_SERVICE_URL"}
    ${"searchServiceUrl"}       | ${"NUXT_PUBLIC_SEARCH_SERVICE_URL"}
    ${"thesaurusServiceUrl"}    | ${"NUXT_PUBLIC_THESAURUS_SERVICE_URL"}
    ${"printServiceUrl"}        | ${"NUXT_PUBLIC_PRINT_SERVICE_URL"}
  `("fails when the public key $key is empty", ({ key, envName }) => {
    Object.assign(config.public, { [key]: "" });

    expect(() => validateRuntimeConfig({} as never)).toThrow(envName);
  });

  it("fails when a value contains only whitespace", () => {
    config.public.iconServiceEndpoint = "   ";

    expect(() => validateRuntimeConfig({} as never)).toThrow(
      "NUXT_PUBLIC_ICON_SERVICE_ENDPOINT",
    );
  });

  it.each`
    description                      | value
    ${"an empty list"}               | ${[]}
    ${"a comma separated string"}    | ${"a.example.test,b.example.test"}
    ${"a list with an empty domain"} | ${["a.example.test", ""]}
  `("fails when the drawing domains are $description", ({ value }) => {
    config.public.drawingAllowedDomains = value;

    expect(() => validateRuntimeConfig({} as never)).toThrow(
      "NUXT_PUBLIC_DRAWING_ALLOWED_DOMAINS",
    );
  });

  it("lists every missing value in one error", () => {
    config.geoadminApiBaseUrl = "";
    config.public.searchServiceUrl = "";

    expect(() => validateRuntimeConfig({} as never)).toThrow(
      "set these environment variables: NUXT_GEOADMIN_API_BASE_URL, NUXT_PUBLIC_SEARCH_SERVICE_URL",
    );
  });
});
