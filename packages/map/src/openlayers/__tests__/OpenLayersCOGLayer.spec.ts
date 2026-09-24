import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useOlCOGLayer from "../../composables/olCOGLayer.composable";
import OpenLayersCOGLayer from "../OpenLayersCOGLayer.vue";

vi.mock("../../composables/olCOGLayer.composable", () => ({
  default: vi.fn(() => ({})),
}));

vi.mock("@/stores/position", () => ({
  default: vi.fn(() => ({
    projection: { epsg: "EPSG:2056" },
  })),
}));

describe("OpenLayersCOGLayer.vue", () => {
  beforeEach(() => {
    vi.mocked(useOlCOGLayer).mockClear();
  });

  it("renders correctly", () => {
    const wrapper = mount(OpenLayersCOGLayer, {
      props: {
        layer: {
          format: "COG",
          layerId: "test-layer",
          uuid: "1234",
          url: "https://example.com/data.tif",
          opacity: 1,
          isVisible: true,
          zIndex: 0,
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("calls useOlCOGLayer composable on mount", () => {
    mount(OpenLayersCOGLayer, {
      props: {
        layer: {
          format: "COG",
          layerId: "test-layer",
          uuid: "1234",
          url: "https://example.com/data.tif",
          opacity: 1,
          isVisible: true,
          zIndex: 0,
        },
      },
    });
    expect(useOlCOGLayer).toHaveBeenCalled();
  });

  it("passes layer and olMap to composable", () => {
    mount(OpenLayersCOGLayer, {
      props: {
        layer: {
          format: "COG",
          layerId: "test-layer",
          uuid: "1234",
          blob: new File(["data"], "test.tif"),
          opacity: 0.8,
          isVisible: true,
          zIndex: 3,
        },
      },
    });
    expect(vi.mocked(useOlCOGLayer)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(useOlCOGLayer).mock.calls[0]![0]!.value.format).toBe(
      "COG",
    );
  });
});
