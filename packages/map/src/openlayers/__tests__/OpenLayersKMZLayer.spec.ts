import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";

import type { KMZLayer } from "@/types";

import useOlKMZLayer from "../../composables/olKMZLayer.composable";
import OpenLayersKMZLayer from "../OpenLayersKMZLayer.vue";

vi.mock("../../composables/olKMZLayer.composable", () => ({
  default: vi.fn(),
}));

const layer: KMZLayer = {
  format: "KMZ",
  layerId: "test-layer",
  uuid: "1234",
  data: new Uint8Array([1, 2, 3]),
  opacity: 1,
  isVisible: true,
  zIndex: 0,
};

describe("OpenLayersKMZLayer.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the layer and map to the KMZ composable", () => {
    const olMap = shallowRef();

    mount(OpenLayersKMZLayer, {
      props: { layer },
      global: {
        provide: { olMap },
      },
    });

    const [layerRef, mapRef] = vi.mocked(useOlKMZLayer).mock.calls[0]!;
    expect(layerRef.value).toStrictEqual(layer);
    expect(mapRef).toBe(olMap);
  });

  it("forwards composable errors", () => {
    const wrapper = mount(OpenLayersKMZLayer, {
      props: { layer },
      global: {
        provide: { olMap: shallowRef() },
      },
    });
    const error = new Error("KMZ initialization failed");
    const onError = vi.mocked(useOlKMZLayer).mock.calls[0]![2];

    onError(error);

    expect(wrapper.emitted("error")).toEqual([[error]]);
  });
});
