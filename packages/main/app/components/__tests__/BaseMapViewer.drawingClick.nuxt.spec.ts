import type * as featureModule from "@swissgeo/feature";

import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useDrawing } from "@swissgeo/drawing";
import { useFeaturesStore } from "@swissgeo/feature";
import { useLayerStore } from "@swissgeo/layers";
import { useMapStore } from "@swissgeo/map";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick } from "vue";

import BaseMapViewer from "../BaseMapViewer.vue";

/**
 * Full-chain regression: click → useMapClickEvent → BaseMapViewer's handler →
 * selectFeatures → features store, with real MapModule + real OL map + real
 * drawing store.
 *
 * Guards the dual-OL-instance regression (@swissgeo/map bundling `ol` in its
 * dist): if the map package's `VectorLayer` class is not the same module
 * instance as the drawing package's, `useMapClickEvent`'s instanceof filter
 * silently drops the drawing layer and the click produces nothing.
 */
const selectFeaturesSpy = vi.hoisted(() => vi.fn());

vi.mock("@swissgeo/feature", async (importOriginal) => {
  const actual = await importOriginal<typeof featureModule>();
  selectFeaturesSpy.mockImplementation(actual.selectFeatures);
  return {
    ...actual,
    selectFeatures: selectFeaturesSpy,
  };
});

describe("BaseMapViewer — drawing feature click pipeline", () => {
  it("fills the features store when clicking a drawn feature", async () => {
    // Seed a harmless layer at mapLayers[0]: the real app always has a
    // background layer there, and without it the drawing layer's converter
    // write at index 1 would leave a hole in the array.
    useMapViewStore().addLayerToBottom({
      layerId: "bg-test",
      uuid: "bg-test-uuid",
      humanId: "bg-test",
      displayName: "Background",
      format: "GEOJSON",
      data: { type: "FeatureCollection", features: [] },
      isVisible: true,
      opacity: 1,
    } as never);

    const ToolboxStub = defineComponent({
      name: "Toolbox",
      template: "<div />",
    });
    // the popup UI has its own specs — stub it here (its UTooltip needs a
    // TooltipProvider that only exists in a full app shell)
    const FeatureInfoPopoverStub = defineComponent({
      name: "FeaturesinfoFeatureInfoPopover",
      template: "<div data-testid='feature-info-popover' />",
    });
    await mountSuspended(BaseMapViewer, {
      global: {
        stubs: {
          Toolbox: ToolboxStub,
          FeaturesinfoFeatureInfoPopover: FeatureInfoPopoverStub,
        },
      },
    });

    const mapStore = useMapStore();
    for (let i = 0; i < 50 && !mapStore.olMap; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(mapStore.olMap).toBeDefined();
    const olMap = mapStore.olMap!;

    const drawing = useDrawing();
    drawing.mountDrawingLayer(olMap);

    const center = olMap.getView().getCenter() ?? [0, 0];
    drawing.drawingVectorLayer.getSource()?.addFeature(
      new Feature({
        geometry: new Point(center),
        name: "drawn point",
        description: "drawn description",
      }),
    );
    await nextTick();

    // the drawing layer must be known to both the OL map and the layer store
    expect(
      olMap
        .getAllLayers()
        .some((layer) => layer.get("uuid") === drawing.DRAWING_LAYER_UUID),
    ).toBe(true);
    expect(
      useLayerStore().layers.some(
        (layer) => layer.uuid === drawing.DRAWING_LAYER_UUID,
      ),
    ).toBe(true);

    olMap.dispatchEvent({
      type: "singleclick",
      coordinate: center,
      pixel: [50, 50],
    } as never);

    await vi.waitFor(() => expect(selectFeaturesSpy).toHaveBeenCalledOnce());

    // the drawing hits are threaded through as pre-resolved features
    const sources = selectFeaturesSpy.mock.calls[0]![3] as Array<{
      layerUuid: string;
      preResolvedFeatures?: unknown[];
    }>;
    const drawingSource = sources.find(
      (source) => source.layerUuid === drawing.DRAWING_LAYER_UUID,
    );
    expect(drawingSource?.preResolvedFeatures).toHaveLength(1);

    // …and land in the features store for the popup
    await vi.waitFor(() => {
      const selection =
        useFeaturesStore().selectedFeaturesByUuid[drawing.DRAWING_LAYER_UUID];
      expect(selection).toHaveLength(1);
      expect(selection![0]!.featureId).toBeDefined();
      expect(selection![0]!.content).toMatchObject({
        kind: "json",
        properties: {
          name: "drawn point",
          description: "drawn description",
        },
      });
    });
    expect(useFeaturesStore().hasSelectedFeatures).toBe(true);
  });
});
