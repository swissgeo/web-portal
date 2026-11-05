import { useSearchStore } from "@swissgeo/skeleton";
import { describe, expect, it } from "vitest";

// Runs in the Nuxt environment, so the real plugins (including
// skeleton-package) are set up before the test.
describe("skeleton-package plugin", () => {
  it("provides the search config the skeleton's search store injects", () => {
    // useSearchStore throws when no SearchConfig was provided
    const store = useSearchStore();

    expect(store.enableCmsSearch).toBe(
      useRuntimeConfig().public.featureFlags.enableCmsSearch === true,
    );
  });
});
