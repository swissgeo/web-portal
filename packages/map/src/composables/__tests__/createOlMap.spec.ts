import type { default as olMap } from "ol/Map";

import { LV95, registerProj4 } from "@swissgeo/coordinates";
import { flushPromises } from "@vue/test-utils";
import { View } from "ol";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "vue";

import { DEFAULT_PROJECTION } from "@/stores/position";

import createOlMap from "../createOlMap";

registerProj4(proj4);
register(proj4);

const { roundZoomLevelMock } = vi.hoisted(() => ({
  roundZoomLevelMock: vi.fn((val: number) => val),
}));

vi.mock("@/stores/position", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import("@/stores/position")>();

  return {
    ...original,
    default: () => ({
      projection: {
        roundZoomLevel: roundZoomLevelMock,
        epsg: LV95.epsg,
      },
    }),
  };
});

// since we're testing if the composable adds a view in onMounted, we need a little
// vue app to be able to fire this hook
function withSetup<T>(composable: () => T): [T, ReturnType<typeof createApp>] {
  let result!: T;

  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });

  app.mount(document.createElement("div"));
  return [result, app];
}

async function doubleClick(olMap: olMap): Promise<void> {
  const viewport = olMap.getViewport();
  // simulating a double click
  const pointerEventInit = {
    bubbles: true,
    cancelable: true,
    clientX: 100,
    clientY: 100,
    button: 0,
    pointerId: 1,
    isPrimary: true,
  };

  viewport.dispatchEvent(new PointerEvent("pointerdown", pointerEventInit));
  viewport.dispatchEvent(new PointerEvent("pointerup", pointerEventInit));
  viewport.dispatchEvent(new PointerEvent("pointerdown", pointerEventInit));
  viewport.dispatchEvent(new PointerEvent("pointerup", pointerEventInit));
  await flushPromises();
}

describe("createOlMap", () => {
  it("creates a map with a view", async () => {
    const [result, app] = withSetup(() => createOlMap());
    await flushPromises();

    expect(result.map.getView()).toBeInstanceOf(View);
    expect(result.map.getView().getCenter()).toEqual(
      DEFAULT_PROJECTION.bounds.center,
    );

    app.unmount();
  });

  it("creates a map with zoomOnlyCtrl interactions", async () => {
    const [result, app] = withSetup(() => createOlMap({ zoomOnlyCtrl: true }));
    await flushPromises();

    expect(result.map.getView()).toBeInstanceOf(View);
    expect(result.map.getInteractions().getLength()).toBeGreaterThan(0);

    app.unmount();
  });

  it("Rounds the zoom level on double click", async () => {
    // we need a rather complicated setup for olMap to receive these events
    const container = document.createElement("div");
    document.body.appendChild(container);

    const [result, app] = withSetup(() => {
      const { map } = createOlMap();
      map.setTarget(container);
      map.setSize([800, 600]);
      return { map };
    });
    await flushPromises();

    const olMap = result.map;

    expect(olMap.getView().getZoom()).toBe(1);

    // setting the initial zoom to something not rounded
    olMap.getView().setZoom(1.2);

    // simulating that the rounding would return 1
    roundZoomLevelMock.mockReturnValueOnce(1);
    await doubleClick(olMap);

    // this should reset the map to zoom level 1
    expect(roundZoomLevelMock).toHaveBeenCalled();
    expect(olMap.getView().getZoom()).toBe(2);

    // clicking again shouldn't trigger it since the value is already rounded
    // the zoom level is now increased by 1
    await doubleClick(olMap);
    expect(roundZoomLevelMock).toHaveBeenCalled();

    expect(olMap.getView().getZoom()).toBe(3);

    app.unmount();
    document.body.removeChild(container);
  });

  it("returns a cleanup function", async () => {
    const [result, app] = withSetup(() => createOlMap());
    await flushPromises();

    expect(result.cleanup).toBeInstanceOf(Function);

    const interactionsBefore = result.map.getInteractions().getLength();
    result.cleanup();
    const interactionsAfter = result.map.getInteractions().getLength();

    expect(interactionsAfter).toBeLessThan(interactionsBefore);

    app.unmount();
  });
});
