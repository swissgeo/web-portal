import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Geogesser from "../Geogesser.vue";

const { searchStore, geogesserStore } = vi.hoisted(() => ({
  searchStore: { query: "", clearSearch: vi.fn() },
  geogesserStore: { isOpen: false, open: vi.fn() },
}));

const reactiveSearchStore = reactive(searchStore);
const reactiveGeogesserStore = reactive(geogesserStore);

vi.mock("@swissgeo/skeleton", () => ({
  useSearchStore: () => reactiveSearchStore,
}));

vi.mock("@/stores/geogesser", () => ({
  useGeogesserStore: () => reactiveGeogesserStore,
}));

// the game itself needs a map, this test covers only when it loads
vi.mock("../GeogesserGame.vue", () => ({
  default: { template: "<div data-testid='game' />" },
}));

describe("Geogesser", () => {
  // a mounted component from an earlier test would answer the query as well
  enableAutoUnmount(afterEach);

  beforeEach(() => {
    reactiveSearchStore.query = "";
    reactiveGeogesserStore.isOpen = false;
    searchStore.clearSearch.mockClear();
    geogesserStore.open.mockClear();
  });

  it.each`
    query                 | opens
    ${"geoguessinggame"}  | ${true}
    ${"GeoGuessingGame "} | ${true}
    ${"bern"}             | ${false}
  `("opens the game for $query: $opens", async ({ query, opens }) => {
    mount(Geogesser);

    reactiveSearchStore.query = query;
    await nextTick();

    expect(geogesserStore.open).toHaveBeenCalledTimes(opens ? 1 : 0);
    expect(searchStore.clearSearch).toHaveBeenCalledTimes(opens ? 1 : 0);
  });

  it("loads the game only while it is open", async () => {
    const wrapper = mount(Geogesser);
    expect(wrapper.find("[data-testid='game']").exists()).toBe(false);

    reactiveGeogesserStore.isOpen = true;
    await flushPromises();
    expect(wrapper.find("[data-testid='game']").exists()).toBe(true);
  });
});
