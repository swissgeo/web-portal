import type { Map as OlMap } from "ol";
import type { Geometry } from "ol/geom";
import type Interaction from "ol/interaction/Interaction";
import type BaseLayer from "ol/layer/Base";
import type { Ref } from "vue";

import { useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { flushPromises, mount } from "@vue/test-utils";
import Feature from "ol/Feature";
import { Circle, LineString, Point, Polygon } from "ol/geom";
import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";

import type { useDrawing } from "@/composables/useDrawing.composable";

import { useDrawing as createDrawingComposable } from "@/composables/useDrawing.composable";
import { useDrawingStore } from "@/stores/drawing.store";
import { DESCRIPTION_KEY, TITLE_KEY } from "@/utils/drawingMetadata";
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_POINT_COLOR,
  DEFAULT_POINT_RADIUS,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  FILL_COLOR_KEY,
  ICON_ANCHOR_KEY,
  ICON_COLOR_KEY,
  ICON_NAME_KEY,
  ICON_SET_NAME_KEY,
  ICON_SIZE_KEY,
  ICON_URL_KEY,
  POINT_COLOR_KEY,
  POINT_RADIUS_KEY,
  SHOW_DESCRIPTION_KEY,
  SHOW_ICON_KEY,
  SHOW_TITLE_KEY,
  STROKE_COLOR_KEY,
  STROKE_WIDTH_KEY,
  TEXT_ALIGN_KEY,
  TEXT_BASELINE_KEY,
  TEXT_COLOR_KEY,
  TEXT_HALO_COLOR_KEY,
  TEXT_PLACEMENT_KEY,
  TEXT_SIZE_KEY,
} from "@/utils/drawingStyleCommon";
import { exportFormatToMimeType } from "@/utils/exportUtils";

import type {
  CircleMetrics,
  LineStringMetrics,
  PointMetrics,
  PolygonMetrics,
} from "../utils/drawingUtils";

type DrawingComposable = ReturnType<typeof useDrawing>;

type FakeMap = {
  interactions: unknown[];
  layers: BaseLayer[];
  addInteraction: ReturnType<typeof vi.fn>;
  removeInteraction: ReturnType<typeof vi.fn>;
  addLayer: ReturnType<typeof vi.fn>;
  removeLayer: ReturnType<typeof vi.fn>;
  getAllLayers: ReturnType<typeof vi.fn>;
  getInteractions: ReturnType<typeof vi.fn>;
  getView: ReturnType<typeof vi.fn>;
};

function createFakeMap(): FakeMap {
  const interactions: unknown[] = [];
  const layers: BaseLayer[] = [];

  const map: FakeMap = {
    interactions,
    layers,
    addInteraction: vi.fn((interaction: Interaction) => {
      if ("selectFeature" in interaction) {
        interaction.setMap(map as unknown as OlMap);
      }
      interactions.push(interaction);
    }),
    removeInteraction: vi.fn((interaction: Interaction) => {
      if ("selectFeature" in interaction) {
        interaction.setMap(null);
      }
      const index = interactions.indexOf(interaction);
      if (index !== -1) {
        interactions.splice(index, 1);
      }
    }),
    addLayer: vi.fn((layer: BaseLayer) => {
      layers.push(layer);
    }),
    removeLayer: vi.fn((layer: BaseLayer) => {
      const index = layers.indexOf(layer);
      if (index !== -1) {
        layers.splice(index, 1);
      }
    }),
    getAllLayers: vi.fn(() => layers),
    getInteractions: vi.fn(() => ({
      getArray: () => interactions,
    })),
    getView: vi.fn(() => ({
      getProjection: () => ({
        getCode: () => "EPSG:2056",
      }),
    })),
  };

  return map;
}

function makeFeature(geometry: Geometry) {
  return new Feature<Geometry>(geometry);
}

function mountHarness() {
  const fakeMap = createFakeMap();
  let drawing: DrawingComposable;

  const Harness = defineComponent({
    setup() {
      drawing = createDrawingComposable();
      return () => h("div");
    },
  });

  const wrapper = mount(Harness);

  return {
    drawing: drawing!,
    drawingStore: useDrawingStore(),
    fakeMap,
    layerStore: useLayerStore(),
    wrapper,
  };
}

async function waitForDebouncedDrawingUpdate() {
  await new Promise((resolve) => setTimeout(resolve, 120));
  await flushPromises();
}

async function focusFeature(
  drawingStore: ReturnType<typeof useDrawingStore>,
  feature: Feature<Geometry>,
  focusMode: "select" | "create" | "edit" | "none" = "select",
) {
  drawingStore.focusedFeature = feature;
  drawingStore.focusMode = focusMode;
  await nextTick();
}

describe("useDrawing", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    vi.spyOn(log, "error").mockImplementation(() => undefined);
  });

  it("mounts and unmounts the drawing layer, interactions, and layer-store entry", () => {
    const { drawing, drawingStore, fakeMap, layerStore, wrapper } =
      mountHarness();
    const feature = makeFeature(new Point([2600000, 1200000]));

    drawingStore.drawingVectorSource.addFeature(feature);
    drawing.mountDrawingLayer(fakeMap as unknown as OlMap);

    expect(fakeMap.interactions).toEqual([
      drawingStore.modifyInteraction,
      drawingStore.drawPointInteraction,
      drawingStore.drawLineStringInteraction,
      drawingStore.drawPolygonInteraction,
      drawingStore.drawCircleInteraction,
      drawingStore.snapInteraction,
      drawingStore.selectInteractions,
    ]);
    expect(fakeMap.layers).toEqual([drawingStore.drawingVectorLayer]);
    expect(layerStore.layers).toEqual([
      expect.objectContaining({
        uuid: drawingStore.drawingVectorLayer.get("uuid"),
        humanId: drawingStore.drawingVectorLayer.get("humanId"),
        type: "kml",
        isLoading: false,
        info: {
          displayName: "Drawing layer",
          abstract: "This layer is for drawings",
        },
      }),
    ]);

    drawing.unmountDrawingLayer();

    expect(fakeMap.interactions).toEqual([]);
    expect(fakeMap.layers).toEqual([]);
    expect(layerStore.layers).toEqual([]);
    expect(drawingStore.drawingVectorSource.getFeatures()).toEqual([]);

    wrapper.unmount();
  });

  it("does not add the drawing layer twice when mounted repeatedly", () => {
    const { drawing, drawingStore, fakeMap, wrapper } = mountHarness();

    drawing.mountDrawingLayer(fakeMap as unknown as OlMap);
    drawing.mountDrawingLayer(fakeMap as unknown as OlMap);

    expect(fakeMap.layers).toEqual([drawingStore.drawingVectorLayer]);

    wrapper.unmount();
  });

  it("clears all features from the drawing source", () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(new Point([2600000, 1200000]));

    drawingStore.drawingVectorSource.addFeature(feature);

    drawing.clearDrawingLayer();

    expect(drawingStore.drawingVectorSource.getFeatures()).toEqual([]);

    wrapper.unmount();
  });

  it("serializes the focused feature in supported formats", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(
      new LineString([
        [2600000, 1200000],
        [2600010, 1200010],
      ]),
    );

    await focusFeature(drawingStore, feature);

    const geoJson = JSON.parse(
      drawing.serializeFocusedFeature("geojson") as string,
    );

    expect(geoJson.features).toHaveLength(1);
    expect(geoJson.features[0].geometry.type).toBe("LineString");
    expect(drawing.serializeFocusedFeature()).toBe(
      drawing.serializeFocusedFeature("geojson"),
    );
    expect(drawing.serializeFocusedFeature("gpx-track")).toContain("<trk>");
    expect(drawing.serializeFocusedFeature("gpx-route")).toContain("<rte>");
    expect(drawing.serializeFocusedFeature("kml")).toContain("<kml");
    expect(drawing.serializeFocusedFeature("kmz")).toBeInstanceOf(ArrayBuffer);

    wrapper.unmount();
  });

  it("returns null when serializing a missing focused feature", () => {
    const { drawing, wrapper } = mountHarness();

    expect(drawing.serializeFocusedFeature()).toBeNull();
    expect(drawing.serializeFocusedFeatureAsBlob()).toBeNull();

    wrapper.unmount();
  });

  it("wraps the focused feature serialization in a typed Blob", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(new Point([2600000, 1200000]));

    await focusFeature(drawingStore, feature);

    const geoJsonBlob = drawing.serializeFocusedFeatureAsBlob("geojson");
    const kmzBlob = drawing.serializeFocusedFeatureAsBlob("kmz");

    expect(geoJsonBlob).toBeInstanceOf(Blob);
    expect(geoJsonBlob?.type).toBe(exportFormatToMimeType.geojson);
    expect(await geoJsonBlob?.text()).toContain("FeatureCollection");
    expect(kmzBlob).toBeInstanceOf(Blob);
    expect(kmzBlob?.type).toBe(exportFormatToMimeType.kmz);
    expect(kmzBlob?.size).toBeGreaterThan(0);

    wrapper.unmount();
  });

  it("serializes all drawing source features in supported formats", () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const pointFeature = makeFeature(new Point([2600000, 1200000]));
    const lineFeature = makeFeature(
      new LineString([
        [2600000, 1200000],
        [2600010, 1200010],
      ]),
    );

    drawingStore.drawingVectorSource.addFeatures([pointFeature, lineFeature]);

    const geoJson = JSON.parse(
      drawing.serializeAllFeatures("geojson") as string,
    );

    expect(geoJson.features).toHaveLength(2);
    expect(drawing.serializeAllFeatures()).toBe(
      drawing.serializeAllFeatures("geojson"),
    );
    expect(drawing.serializeAllFeatures("gpx-track")).toContain("<trk>");
    expect(drawing.serializeAllFeatures("gpx-route")).toContain("<rte>");
    expect(drawing.serializeAllFeatures("kml")).toContain("<kml");
    expect(drawing.serializeAllFeatures("kmz")).toBeInstanceOf(ArrayBuffer);

    wrapper.unmount();
  });

  it("wraps all-feature serialization in a typed Blob", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(
      new LineString([
        [2600000, 1200000],
        [2600010, 1200010],
      ]),
    );

    drawingStore.drawingVectorSource.addFeature(feature);

    const gpxBlob = drawing.serializeAllFeaturesAsBlob("gpx-route");
    const geoJsonBlob = drawing.serializeAllFeaturesAsBlob("geojson");

    expect(gpxBlob).toBeInstanceOf(Blob);
    expect(gpxBlob?.type).toBe(exportFormatToMimeType["gpx-route"]);
    expect(await gpxBlob?.text()).toContain("<rte>");
    expect(geoJsonBlob).toBeInstanceOf(Blob);
    expect(geoJsonBlob?.type).toBe(exportFormatToMimeType.geojson);
    expect(await geoJsonBlob?.text()).toContain("FeatureCollection");

    wrapper.unmount();
  });

  it("reports whether a uuid belongs to the drawing layer", () => {
    const { drawingStore, wrapper } = mountHarness();
    const drawingLayerUuid = drawingStore.drawingVectorLayer.get("uuid");

    expect(drawingStore.DRAWING_LAYER_UUID === drawingLayerUuid).toBe(true);
    expect(
      drawingStore.DRAWING_LAYER_UUID ===
        "00000000-0000-0000-0000-000000000000",
    ).toBe(false);

    wrapper.unmount();
  });

  it("enables selection from a clean focus state", async () => {
    const { drawing, drawingStore, wrapper, fakeMap } = mountHarness();
    const feature = makeFeature(new Point([2600000, 1200000]));

    drawingStore.drawingVectorSource.addFeature(feature);
    drawing.mountDrawingLayer(fakeMap as unknown as OlMap);
    drawingStore.focusedFeature = feature;
    drawingStore.focusMode = "edit";
    drawingStore.selectInteractions.selectFeature(feature);

    drawing.enableSelectInteraction();
    await nextTick();

    expect(drawingStore.selectInteractions.getActive()).toBe(true);
    expect(drawingStore.focusedFeature).toBeNull();
    expect(drawingStore.focusMode).toBe("none");
    expect(drawingStore.selectInteractions.getFeatures().getLength()).toBe(0);

    wrapper.unmount();
  });

  it("does not enable modify mode without a focused feature", () => {
    const { drawing, drawingStore, wrapper } = mountHarness();

    drawing.enableModifyInteraction();

    expect(drawingStore.modifyInteraction.getActive()).toBe(false);
    expect(drawingStore.snapInteraction.getActive()).toBe(false);
    expect(drawingStore.focusMode).toBe("none");

    wrapper.unmount();
  });

  it("enables modify mode for a focused feature", async () => {
    const { drawing, drawingStore, wrapper, fakeMap } = mountHarness();
    drawing.mountDrawingLayer(fakeMap as unknown as OlMap);

    const feature = makeFeature(new Point([2600000, 1200000]));

    await focusFeature(drawingStore, feature);

    drawing.enableModifyInteraction();
    await nextTick();

    expect(drawingStore.modifyInteraction.getActive()).toBe(true);
    expect(drawingStore.snapInteraction.getActive()).toBe(true);
    expect(drawingStore.focusMode).toBe("edit");

    wrapper.unmount();
  });

  it.each([
    ["Point", "drawPointInteraction"],
    ["LineString", "drawLineStringInteraction"],
    ["Polygon", "drawPolygonInteraction"],
    ["Circle", "drawCircleInteraction"],
  ] as const)("enables %s drawing mode", (geometryType, interactionKey) => {
    const { drawing, drawingStore, wrapper, fakeMap } = mountHarness();
    drawing.mountDrawingLayer(fakeMap as unknown as OlMap);

    drawing.enableDrawInteraction(geometryType);

    expect(drawingStore[interactionKey].getActive()).toBe(true);
    expect(drawingStore.snapInteraction.getActive()).toBe(true);
    expect(drawingStore.focusMode).toBe("create");

    wrapper.unmount();
  });

  it("keeps a drawn feature focused after draw end", async () => {
    const { drawing, drawingStore, wrapper, fakeMap } = mountHarness();
    const feature = makeFeature(new Point([2600000, 1200000]));

    drawingStore.drawingVectorSource.addFeature(feature);
    drawing.mountDrawingLayer(fakeMap as unknown as OlMap);
    drawing.enableDrawInteraction("Point");
    drawingStore.drawPointInteraction.dispatchEvent({
      type: "drawstart",
      feature,
    } as never);
    await nextTick();

    expect(drawingStore.focusedFeature).toBe(feature);

    drawingStore.drawPointInteraction.dispatchEvent({
      type: "drawend",
      feature,
    } as never);
    await flushPromises();
    await nextTick();

    expect(drawingStore.drawPointInteraction.getActive()).toBe(false);
    expect(drawingStore.snapInteraction.getActive()).toBe(false);
    expect(drawingStore.selectInteractions.getActive()).toBe(true);
    expect(drawingStore.selectInteractions.getFeatures().getArray()).toContain(
      feature,
    );
    expect(drawingStore.focusMode).toBe("select");

    wrapper.unmount();
  });

  it("updates focus when the select interaction selection changes", async () => {
    const { drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(new Point([2600000, 1200000]));

    drawingStore.selectInteractions.dispatchEvent({
      type: "select",
      target: {
        getFeatures: () => ({
          getArray: () => [feature],
        }),
      },
    } as never);
    await nextTick();

    expect(drawingStore.focusedFeature).toBe(feature);
    expect(drawingStore.focusMode).toBe("select");

    drawingStore.selectInteractions.dispatchEvent({
      type: "select",
      target: {
        getFeatures: () => ({
          getArray: (): Feature<Geometry>[] => [],
        }),
      },
    } as never);
    await nextTick();

    expect(drawingStore.focusedFeature).toBeNull();
    expect(drawingStore.focusMode).toBe("none");

    wrapper.unmount();
  });

  it("initializes editable properties for newly created features", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(
      new Polygon([
        [
          [0, 0],
          [4, 0],
          [4, 3],
          [0, 0],
        ],
      ]),
    );

    await focusFeature(drawingStore, feature, "create");

    expect(feature.get(FILL_COLOR_KEY)).toBe(DEFAULT_FILL_COLOR);
    expect(feature.get(STROKE_COLOR_KEY)).toBe(DEFAULT_STROKE_COLOR);
    expect(feature.get(STROKE_WIDTH_KEY)).toBe(DEFAULT_STROKE_WIDTH);
    expect(feature.get(TITLE_KEY)).toMatch(/^Feature \d+$/);
    expect(feature.get(DESCRIPTION_KEY)).toBe("");

    drawing.title.value = "Updated drawing";
    drawing.description.value = "A useful note";
    drawing.fillColor.value = "#112233";
    drawing.strokeColor.value = "#445566";
    drawing.strokeWidth.value = 7;

    expect(feature.get(TITLE_KEY)).toBe("Updated drawing");
    expect(feature.get(DESCRIPTION_KEY)).toBe("A useful note");
    expect(feature.get(FILL_COLOR_KEY)).toBe("#112233");
    expect(feature.get(STROKE_COLOR_KEY)).toBe("#445566");
    expect(feature.get(STROKE_WIDTH_KEY)).toBe(7);

    wrapper.unmount();
  });

  it("updates every point style property through writable computed refs", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(new Point([2600000, 1200000]));

    await focusFeature(drawingStore, feature, "create");

    expect(feature.get(POINT_RADIUS_KEY)).toBe(DEFAULT_POINT_RADIUS);
    expect(feature.get(POINT_COLOR_KEY)).toBe(DEFAULT_POINT_COLOR);

    drawing.pointRadius.value = 12;
    drawing.pointColor.value = "#abcdef";
    drawing.iconUrl.value = "https://icons.test/imported.png";
    expect(feature.get(SHOW_ICON_KEY)).toBe(true);

    drawing.iconSetName.value = "transport";
    drawing.iconName.value = "station";
    drawing.iconColor.value = "#123456";
    drawing.showTitle.value = true;
    drawing.showDescription.value = true;
    drawing.showIcon.value = false;
    drawing.iconSize.value = "xlarge";
    drawing.iconAnchor.value = [0.25, 0.75];
    drawing.textBaseline.value = "bottom";
    drawing.textAlign.value = "right";
    drawing.textColor.value = "#112233";
    drawing.textHaloColor.value = "#fefefe";
    drawing.textSize.value = "large";
    drawing.textPlacement.value = "south-west";

    expect(feature.get(POINT_RADIUS_KEY)).toBe(12);
    expect(feature.get(POINT_COLOR_KEY)).toBe("#abcdef");
    expect(feature.get(ICON_URL_KEY)).toBe("");
    expect(feature.get(ICON_SET_NAME_KEY)).toBe("transport");
    expect(feature.get(ICON_NAME_KEY)).toBe("station");
    expect(feature.get(ICON_COLOR_KEY)).toBe("#123456");
    expect(feature.get(SHOW_TITLE_KEY)).toBe(true);
    expect(feature.get(SHOW_DESCRIPTION_KEY)).toBe(true);
    expect(feature.get(SHOW_ICON_KEY)).toBe(false);
    expect(feature.get(ICON_SIZE_KEY)).toBe("xlarge");
    expect(feature.get(ICON_ANCHOR_KEY)).toEqual([0.25, 0.75]);
    expect(feature.get(TEXT_BASELINE_KEY)).toBe("bottom");
    expect(feature.get(TEXT_ALIGN_KEY)).toBe("right");
    expect(feature.get(TEXT_COLOR_KEY)).toBe("#112233");
    expect(feature.get(TEXT_HALO_COLOR_KEY)).toBe("#fefefe");
    expect(feature.get(TEXT_SIZE_KEY)).toBe("large");
    expect(feature.get(TEXT_PLACEMENT_KEY)).toBe("south-west");

    expect(drawing.iconSetName.value).toBe("transport");
    expect(drawing.iconName.value).toBe("station");
    expect(drawing.iconColor.value).toBe("#123456");
    expect(drawing.showTitle.value).toBe(true);
    expect(drawing.showDescription.value).toBe(true);
    expect(drawing.showIcon.value).toBe(false);
    expect(drawing.iconSize.value).toBe("xlarge");
    expect(drawing.iconAnchor.value).toEqual([0.25, 0.75]);
    expect(drawing.textBaseline.value).toBe("bottom");
    expect(drawing.textAlign.value).toBe("right");
    expect(drawing.textColor.value).toBe("#112233");
    expect(drawing.textHaloColor.value).toBe("#fefefe");
    expect(drawing.textSize.value).toBe("large");
    expect(drawing.textPlacement.value).toBe("south-west");

    wrapper.unmount();
  });

  it("removes the currently focused feature", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(new Point([2600000, 1200000]));

    drawingStore.drawingVectorSource.addFeature(feature);
    await focusFeature(drawingStore, feature);

    drawing.removeFocusedFeature();

    expect(drawingStore.drawingVectorSource.getFeatures()).toEqual([]);
    expect(drawingStore.focusedFeature).toBeNull();
    expect(drawingStore.focusMode).toBe("none");

    wrapper.unmount();
  });

  it("exposes the focused feature type", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(
      new LineString([
        [0, 0],
        [3, 4],
      ]),
    );

    expect((drawing.focusedFeatureType as Ref<string | null>).value).toBeNull();

    await focusFeature(drawingStore, feature);

    expect((drawing.focusedFeatureType as Ref<string | null>).value).toBe(
      "LineString",
    );

    wrapper.unmount();
  });

  it("computes metrics for point features", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(new Point([2600000, 1200000]));

    await focusFeature(drawingStore, feature);
    await waitForDebouncedDrawingUpdate();

    const metrics = drawing.focusedFeatureMetrics.value as PointMetrics;

    expect(metrics.coordinate).toEqual([2600000, 1200000]);
    expect(metrics.coordinatesWgs84).toHaveLength(2);
    expect(metrics.coordinatesWgs84[0]).toBeCloseTo(7.4386, 3);
    expect(metrics.coordinatesWgs84[1]).toBeCloseTo(46.951, 3);

    wrapper.unmount();
  });

  it("computes metrics for line string features", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(
      new LineString([
        [0, 0],
        [3, 4],
      ]),
    );

    await focusFeature(drawingStore, feature);
    await waitForDebouncedDrawingUpdate();

    const metrics = drawing.focusedFeatureMetrics.value as LineStringMetrics;

    expect(metrics.lengthMeters).toBe(5);

    wrapper.unmount();
  });

  it("computes metrics for polygon features", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(
      new Polygon([
        [
          [0, 0],
          [4, 0],
          [4, 3],
          [0, 0],
        ],
      ]),
    );

    await focusFeature(drawingStore, feature);
    await waitForDebouncedDrawingUpdate();

    const metrics = drawing.focusedFeatureMetrics.value as PolygonMetrics;

    expect(metrics.areaSquareMeters).toBe(6);
    expect(metrics.perimeterMeters).toBe(12);

    wrapper.unmount();
  });

  it("computes metrics for circle features", async () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const feature = makeFeature(new Circle([2600000, 1200000], 10));

    await focusFeature(drawingStore, feature);
    await waitForDebouncedDrawingUpdate();

    const metrics = drawing.focusedFeatureMetrics.value as CircleMetrics;

    expect(metrics.center).toEqual([2600000, 1200000]);
    expect(metrics.centerWgs84[0]).toBeCloseTo(7.4386, 3);
    expect(metrics.centerWgs84[1]).toBeCloseTo(46.951, 3);
    expect(metrics.radiusMeters).toBe(10);
    expect(metrics.areaSquareMeters).toBeCloseTo(Math.PI * 100);
    expect(metrics.perimeterMeters).toBeCloseTo(2 * Math.PI * 10);

    wrapper.unmount();
  });

  it("imports features from a KML string into the drawing source", () => {
    const { drawing, drawingStore, wrapper } = mountHarness();

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Point</name>
      <Point>
        <coordinates>8.2,46.8,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

    drawing.importKml(kml);

    const features = drawingStore.drawingVectorSource.getFeatures();
    expect(features).toHaveLength(1);
    expect(features[0].getGeometry()?.getType()).toBe("Point");

    wrapper.unmount();
  });

  it("replaces an already imported feature with the same KML id", () => {
    const { drawing, drawingStore, wrapper } = mountHarness();
    const makeKml = (
      longitude: number,
    ) => `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark id="shared-marker">
      <name>Shared marker</name>
      <Point>
        <coordinates>${longitude},46.8,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

    drawing.importKml(makeKml(8.2));
    const original = drawingStore.drawingVectorSource.getFeatures()[0];

    drawing.importKml(makeKml(8.3));

    const features = drawingStore.drawingVectorSource.getFeatures();
    expect(features).toHaveLength(1);
    expect(features[0]).not.toBe(original);
    expect(features[0].getId()).toBe("shared-marker");

    wrapper.unmount();
  });
});
