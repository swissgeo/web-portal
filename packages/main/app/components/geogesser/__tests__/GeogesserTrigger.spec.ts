import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reactive } from "vue";

import GeogesserTrigger from "../GeogesserTrigger.vue";

const { searchStore, geogesserStore, route, navigateToMock } = vi.hoisted(
  () => ({
    searchStore: { query: "", clearSearch: vi.fn() },
    geogesserStore: { open: vi.fn() },
    route: { name: "map___de" as string },
    navigateToMock: vi.fn(),
  }),
);

const reactiveSearchStore = reactive(searchStore);

vi.mock("@swissgeo/skeleton", () => ({
  useSearchStore: () => reactiveSearchStore,
}));

vi.mock("@/stores/geogesser", () => ({
  useGeogesserStore: () => geogesserStore,
}));

mockNuxtImport("useRoute", () => () => route);
mockNuxtImport("useLocalePath", () => () => (path: string) => `/de${path}`);
mockNuxtImport("navigateTo", () => navigateToMock);

describe("GeogesserTrigger", () => {
  // a mounted component from an earlier test would answer the query as well
  enableAutoUnmount(afterEach);

  beforeEach(() => {
    reactiveSearchStore.query = "";
    route.name = "map___de";
    searchStore.clearSearch.mockClear();
    geogesserStore.open.mockClear();
    navigateToMock.mockClear();
  });

  it.each`
    query                 | opens
    ${"geoguessinggame"}  | ${true}
    ${"GeoGuessingGame "} | ${true}
    ${"bern"}             | ${false}
  `("opens the game for $query: $opens", async ({ query, opens }) => {
    mount(GeogesserTrigger);

    reactiveSearchStore.query = query;
    await flushPromises();

    expect(geogesserStore.open).toHaveBeenCalledTimes(opens ? 1 : 0);
    expect(searchStore.clearSearch).toHaveBeenCalledTimes(opens ? 1 : 0);
  });

  it.each`
    routeName                | navigates
    ${"map___de"}            | ${false}
    ${"map-dataset-id___de"} | ${false}
    ${"index___de"}          | ${true}
  `(
    "goes to the map from $routeName: $navigates",
    async ({ routeName, navigates }) => {
      route.name = routeName;
      mount(GeogesserTrigger);

      reactiveSearchStore.query = "geoguessinggame";
      await flushPromises();

      expect(navigateToMock).toHaveBeenCalledTimes(navigates ? 1 : 0);
      if (navigates) {
        expect(navigateToMock).toHaveBeenCalledWith("/de/map");
      }
    },
  );
});
