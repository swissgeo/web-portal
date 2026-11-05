import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ZoomButtons from "@/components/toolbox/toolboxButtons/ZoomButtons.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const { increaseZoom, decreaseZoom } = vi.hoisted(() => ({
  increaseZoom: vi.fn(),
  decreaseZoom: vi.fn(),
}));

vi.mock("@swissgeo/map", () => ({
  usePositionStore: () => ({
    increaseZoom,
    decreaseZoom,
    canIncreaseZoom: () => true,
    canDecreaseZoom: () => true,
  }),
}));

describe("ZoomButtons.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  function mountButtons() {
    return mount(ZoomButtons, {
      global: {
        stubs: {
          UButton: {
            template: "<button @click=\"$emit('click')\" />",
            emits: ["click"],
          },
        },
      },
    });
  }

  it("shows translated titles", () => {
    const titles = mountButtons()
      .findAll("button")
      .map((button) => button.attributes("title"));
    expect(titles).toEqual(["toolbox.zoom.zoomIn", "toolbox.zoom.zoomOut"]);
  });

  it.each`
    index | action
    ${0}  | ${increaseZoom}
    ${1}  | ${decreaseZoom}
  `("calls the zoom action of button $index", async ({ index, action }) => {
    await mountButtons().findAll("button")[index]!.trigger("click");
    expect(action).toHaveBeenCalledOnce();
  });
});
