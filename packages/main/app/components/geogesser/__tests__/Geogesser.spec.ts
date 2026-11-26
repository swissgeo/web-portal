import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Geogesser from "../Geogesser.vue";

const { reactiveGeogesserStore } = await vi.hoisted(async () => {
  const { reactive } = await import("vue");
  return { reactiveGeogesserStore: reactive({ isOpen: false }) };
});

vi.mock("@/stores/geogesser", () => ({
  useGeogesserStore: () => reactiveGeogesserStore,
}));

// the game itself needs a map, this test covers only when it loads
vi.mock("../GeogesserGame.vue", () => ({
  default: { template: "<div data-testid='game' />" },
}));

describe("Geogesser", () => {
  enableAutoUnmount(afterEach);

  beforeEach(() => {
    reactiveGeogesserStore.isOpen = false;
  });

  it("loads the game only while it is open", async () => {
    const wrapper = mount(Geogesser);
    expect(wrapper.find("[data-testid='game']").exists()).toBe(false);

    reactiveGeogesserStore.isOpen = true;
    await flushPromises();
    expect(wrapper.find("[data-testid='game']").exists()).toBe(true);
  });
});
