import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { getResolutionForScale } from "~/utils/printUtils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, reactive } from "vue";

import { usePrintStatus } from "../usePrintStatus";

const { mockGetPrintConfigFromUrl } = vi.hoisted(() => ({
  mockGetPrintConfigFromUrl: vi.fn(),
}));

const setPinnedTileResolution = vi.fn();
const mapStore = reactive({
  isMapLoaded: false,
  olMap: null as unknown,
  setPinnedTileResolution,
});

mockNuxtImport("useUrlParams", () => () => ({
  getPrintConfigFromUrl: mockGetPrintConfigFromUrl,
}));

vi.mock("@swissgeo/map", () => ({
  useMapStore: () => mapStore,
}));

function makeMap(initialResolution: number) {
  const listeners: Record<string, (() => void)[]> = {};
  const view = {
    animating: false,
    resolution: initialResolution,
    getAnimating() {
      return this.animating;
    },
    getResolution() {
      return this.resolution;
    },
    setResolution(resolution: number) {
      this.resolution = resolution;
    },
  };
  const map = {
    getView: () => view,
    on: (event: string, fn: () => void) => {
      (listeners[event] ??= []).push(fn);
    },
    render: vi.fn(),
    un: (event: string, fn: () => void) => {
      listeners[event] = (listeners[event] ?? []).filter((l) => l !== fn);
    },
    emit: (event: string) => listeners[event]?.forEach((fn) => fn()),
  };
  return { map, view };
}

const wrappers: { unmount: () => void }[] = [];

async function mountStatus() {
  let status!: ReturnType<typeof usePrintStatus>;
  const wrapper = mount(
    defineComponent({
      setup() {
        status = usePrintStatus();
        return () => h("div");
      },
    }),
  );
  wrappers.push(wrapper);
  status.setPageReady();
  await nextTick();
}

describe("usePrintStatus", () => {
  const postMessage = vi.spyOn(globalThis, "postMessage");

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  beforeEach(() => {
    postMessage.mockClear().mockImplementation(() => undefined);
    mapStore.isMapLoaded = false;
    mapStore.olMap = null;
    setPinnedTileResolution.mockClear();
  });

  it("signals ready as soon as the map is loaded when no scale is requested", async () => {
    mockGetPrintConfigFromUrl.mockReturnValue({ resolution: 96 });
    await mountStatus();
    expect(postMessage).not.toHaveBeenCalled();

    mapStore.isMapLoaded = true;
    await nextTick();

    expect(postMessage).toHaveBeenCalledWith({ type: "gaMapReady" });
  });

  it("sets the exact resolution of the scale and waits for it to be drawn before signaling", async () => {
    mockGetPrintConfigFromUrl.mockReturnValue({
      resolution: 96,
      scale: 25000,
    });
    const { map, view } = makeMap(5);
    mapStore.olMap = map;
    await mountStatus();

    mapStore.isMapLoaded = true;
    await nextTick();

    expect(view.resolution).toBe(getResolutionForScale(25000, 96));
    expect(postMessage).not.toHaveBeenCalled();

    map.emit("rendercomplete");
    await nextTick();
    expect(postMessage).toHaveBeenCalledWith({ type: "gaMapReady" });
  });

  it("re-applies the resolution when the state animation overrides it, and does not signal meanwhile", async () => {
    mockGetPrintConfigFromUrl.mockReturnValue({
      resolution: 96,
      scale: 50000,
    });
    const { map, view } = makeMap(5);
    mapStore.olMap = map;
    await mountStatus();
    mapStore.isMapLoaded = true;
    await nextTick();

    // the animation to the zoom of the state ends on a discrete resolution
    view.resolution = 10;
    map.emit("rendercomplete");
    await nextTick();
    expect(postMessage).not.toHaveBeenCalled();

    map.emit("moveend");
    expect(view.resolution).toBe(getResolutionForScale(50000, 96));

    map.emit("rendercomplete");
    await nextTick();
    expect(postMessage).toHaveBeenCalledOnce();
  });

  it("still signals ready when the state already put the view at the exact resolution", async () => {
    mockGetPrintConfigFromUrl.mockReturnValue({
      resolution: 96,
      scale: 25000,
    });
    const { map, view } = makeMap(getResolutionForScale(25000, 96));
    mapStore.olMap = map;
    await mountStatus();
    mapStore.isMapLoaded = true;
    await nextTick();

    // nothing changes the view, so a frame has to be requested for "rendercomplete" to come
    expect(view.resolution).toBe(getResolutionForScale(25000, 96));
    expect(map.render).toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();

    map.emit("rendercomplete");
    await nextTick();
    expect(postMessage).toHaveBeenCalledWith({ type: "gaMapReady" });
  });

  it.each([
    [10000, 1],
    [25000, 2.5],
    [50000, 5],
    [100000, 10],
    [200000, 20],
    [500000, 50],
    [1000000, 100],
  ])(
    "makes the layers use the tile level of 1:%s (%s m/px)",
    async (scale, tileResolution) => {
      mockGetPrintConfigFromUrl.mockReturnValue({ resolution: 96, scale });
      mapStore.olMap = makeMap(2.5).map;
      await mountStatus();

      expect(setPinnedTileResolution).toHaveBeenCalledWith(tileResolution);
    },
  );

  it("lets the tile level go again when the page is left", async () => {
    mockGetPrintConfigFromUrl.mockReturnValue({ resolution: 96, scale: 25000 });
    await mountStatus();
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());

    expect(setPinnedTileResolution).toHaveBeenLastCalledWith(null);
  });

  it("pins nothing for a scale that is not offered in fixed-scale mode", async () => {
    mockGetPrintConfigFromUrl.mockReturnValue({
      resolution: 96,
      scale: 30000,
    });
    await mountStatus();

    expect(setPinnedTileResolution).not.toHaveBeenCalled();
  });

  it("pins nothing when the page has no scale", async () => {
    mockGetPrintConfigFromUrl.mockReturnValue({ resolution: 96 });
    await mountStatus();

    expect(setPinnedTileResolution).not.toHaveBeenCalled();
  });
});
