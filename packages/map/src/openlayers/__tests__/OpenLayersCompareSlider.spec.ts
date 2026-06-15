import type { Map as OlMapType } from "ol";

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import OpenLayersCompareSlider from "../OpenLayersCompareSlider.vue";

// identity transform so the clip width equals ratio * map width
vi.mock("ol/render", () => ({
  getRenderPixel: (_event: unknown, coordinate: [number, number]) => coordinate,
}));

// cancelling a listener key flips its `cancelled` flag (see fake map below)
vi.mock("ol/Observable", () => ({
  unByKey: (key: { cancelled: boolean } | { cancelled: boolean }[]) => {
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach((k) => {
      if (k) {
        k.cancelled = true;
      }
    });
  },
}));

interface RenderCompleteKey {
  listener: () => void;
  cancelled: boolean;
}

type RenderHandler = (..._args: unknown[]) => void;

function createFakeLayer(props: Record<string, unknown>) {
  const handlers: Record<string, RenderHandler> = {};
  return {
    props,
    handlers,
    get: (key: string) => props[key],
    on: (type: string, handler: RenderHandler) => {
      handlers[type] = handler;
    },
    un: (type: string) => {
      delete handlers[type];
    },
  };
}

type FakeLayer = ReturnType<typeof createFakeLayer>;

// the OL map plus the test-only handles we drive it with, so callers don't need
// to cast to reach `setLayers` / `__fireRenderComplete`
type FakeMap = OlMapType & {
  /** Replace the layers currently "on the map" (what getAllLayers returns). */
  setLayers: (_layers: FakeLayer[]) => void;
  /** Simulate a render completing (ol clears its once-listeners afterwards). */
  __fireRenderComplete: () => void;
};

function createFakeMap(layers: FakeLayer[], size: [number, number]): FakeMap {
  // a real element so getBoundingClientRect / ResizeObserver work in happy-dom
  const viewport = document.createElement("div");
  viewport.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: size[0],
      height: size[1],
    }) as DOMRect;
  // layers actually "on the map"; mutable so a test can add them after mount
  let currentLayers = layers;
  // models ol's once("rendercomplete", …): returns a key and only fires
  // listeners that have not been cancelled via unByKey
  const renderCompleteKeys: RenderCompleteKey[] = [];
  return {
    render: vi.fn(),
    once: (_type: string, listener: () => void) => {
      const key: RenderCompleteKey = { listener, cancelled: false };
      renderCompleteKeys.push(key);
      return key;
    },
    getSize: () => size,
    getViewport: () => viewport,
    getAllLayers: () => currentLayers,
    setLayers: (next: FakeLayer[]) => {
      currentLayers = next;
    },
    __fireRenderComplete: () => {
      renderCompleteKeys.splice(0).forEach((key) => {
        if (!key.cancelled) {
          key.listener();
        }
      });
    },
  } as unknown as FakeMap;
}

async function mountSlider(
  map: OlMapType,
  clippedLayer?: { layerId: string; uuid: string; displayName?: string },
  compareRatio = 0.5,
) {
  const wrapper = mount(OpenLayersCompareSlider, {
    props: { compareRatio, clippedLayer },
    global: {
      provide: { olMap: ref(map) },
    },
  });
  // let the async onMounted hook measure the map element
  await flushPromises();
  return wrapper;
}

const TOP_LAYER = {
  layerId: "layer-1",
  uuid: "uuid-1",
  displayName: "Layer 1",
};

describe("OpenLayersCompareSlider.vue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("anchors the slider to the map element at the compare ratio", async () => {
    const layer = createFakeLayer({ id: "layer-1", uuid: "uuid-1", zIndex: 1 });
    // map element offset 100px from the viewport, 1000px wide
    const map = createFakeMap([layer], [1000, 500]);
    (map.getViewport() as HTMLElement).getBoundingClientRect = () =>
      ({ left: 100, top: 0, width: 1000, height: 500 }) as DOMRect;
    const wrapper = await mountSlider(map, TOP_LAYER);

    const slider = wrapper.find('[data-testid="compare-slider"]');
    expect(slider.exists()).toBe(true);
    // left = map.left (100) + ratio (0.5) * map.width (1000) = 600px
    expect(slider.attributes("style")).toContain("left: 600px");
  });

  it("registers prerender/postrender clipping on the top layer", async () => {
    const layer = createFakeLayer({ id: "layer-1", uuid: "uuid-1", zIndex: 1 });
    await mountSlider(createFakeMap([layer], [1000, 500]), TOP_LAYER);

    expect(typeof layer.handlers["prerender"]).toBe("function");
    expect(typeof layer.handlers["postrender"]).toBe("function");
  });

  it("clips the top layer canvas to the left of the slider on prerender", async () => {
    const layer = createFakeLayer({ id: "layer-1", uuid: "uuid-1", zIndex: 1 });
    await mountSlider(createFakeMap([layer], [1000, 500]), TOP_LAYER, 0.5);

    const context = {
      canvas: { width: 1000, height: 500 },
      save: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      restore: vi.fn(),
    };

    layer.handlers["prerender"]?.({ context });

    expect(context.save).toHaveBeenCalled();
    // ratio 0.5 of a 1000px-wide map → clip rectangle 500px wide
    expect(context.rect).toHaveBeenCalledWith(0, 0, 500, 500);
    expect(context.clip).toHaveBeenCalled();
  });

  it("emits a clamped ratio when the slider is released after a drag", async () => {
    const layer = createFakeLayer({ id: "layer-1", uuid: "uuid-1", zIndex: 1 });
    const wrapper = await mountSlider(
      createFakeMap([layer], [1000, 500]),
      TOP_LAYER,
      0.5,
    );

    await wrapper
      .find('[data-testid="compare-slider"]')
      .trigger("mousedown", { clientX: 500 });
    // map starts at viewport x=0, so clientX 300 → 300px into a 1000px map → 0.3
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 300 }));
    window.dispatchEvent(new MouseEvent("mouseup"));

    const emitted = wrapper.emitted("update:compareRatio");
    expect(emitted).toBeTruthy();
    expect(emitted?.at(-1)?.[0]).toBeCloseTo(0.3, 3);
  });

  it("removes the clipping handlers when unmounted", async () => {
    const layer = createFakeLayer({ id: "layer-1", uuid: "uuid-1", zIndex: 1 });
    const wrapper = await mountSlider(
      createFakeMap([layer], [1000, 500]),
      TOP_LAYER,
    );

    expect(typeof layer.handlers["prerender"]).toBe("function");
    wrapper.unmount();
    expect(layer.handlers["prerender"]).toBeUndefined();
    expect(layer.handlers["postrender"]).toBeUndefined();
  });

  it("does not clip a stale layer when the top layer changes before render completes", async () => {
    // both layers exist on the map, but neither matches the initial top layer,
    // so the first registration is deferred to a "rendercomplete" listener
    const layerA = createFakeLayer({ id: "a", uuid: "a", zIndex: 1 });
    const layerB = createFakeLayer({ id: "b", uuid: "b", zIndex: 2 });
    const map = createFakeMap([layerA, layerB], [1000, 500]);

    // start with layer A on top, but pretend it isn't on the map yet
    map.setLayers([]);
    const wrapper = await mountSlider(map, { layerId: "a", uuid: "a" });

    // the layers are now actually on the map
    map.setLayers([layerA, layerB]);

    // top layer switches to B (present) before the deferred A registration fires
    await wrapper.setProps({ clippedLayer: { layerId: "b", uuid: "b" } });
    map.__fireRenderComplete();

    // the stale A registration must have been cancelled
    expect(layerA.handlers["prerender"]).toBeUndefined();
    // and B (the current top layer) is the one being clipped
    expect(typeof layerB.handlers["prerender"]).toBe("function");
  });
});
