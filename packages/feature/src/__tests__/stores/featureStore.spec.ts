import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import type { FeatureData, WmsFeatureInfoCapability } from "@/types";

import { useFeaturesStore } from "@/stores/feature";

const mockFeatureData: FeatureData[] = [
  {
    featureId: "feature-id-1",
    geometry: {
      coordinates: [0, 0],
      type: "Point",
    },
    content: {
      kind: "html",
      trusted: true,
      html: "test-1",
      shareable: true,
    },
  },
  {
    featureId: "feature-id-2",
    geometry: {
      coordinates: [9, 4],
      type: "Point",
    },
    content: {
      kind: "html",
      trusted: true,
      html: "test-2",
      shareable: true,
    },
  },
  {
    featureId: "feature-id-3",
    geometry: {
      coordinates: [12, 12],
      type: "Point",
    },
    content: {
      kind: "html",
      trusted: false,
      html: "test-3",
      shareable: true,
    },
  },
];

describe("identify functionalities of the feature module", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("starts with an empty store, and all getters return empty items", () => {
    const featureStore = useFeaturesStore();

    expect(featureStore.selectedFeaturesByUuid).toEqual({});
    expect(featureStore.getFeaturesIdsByUuid).toEqual({});
    expect(featureStore.getPopupsByUuid).toEqual({});
    expect(featureStore.getFeaturesGeoJSON).toEqual({
      type: "FeatureCollection",
      features: [],
    });
    expect(featureStore.hasSelectedFeatures).toEqual(false);
  });

  it("wraps all selected geometries as a GeoJSON FeatureCollection when using getFeaturesGeoJSON", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-a"] = [mockFeatureData[0]];
    featureStore.selectedFeaturesByUuid["uuid-b"] = [
      mockFeatureData[1],
      mockFeatureData[2],
    ];

    const collection = featureStore.getFeaturesGeoJSON;
    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features).toHaveLength(3);

    // every entry is a GeoJSON Feature carrying its featureId and layerUuid
    // (needed by the highlight layer for per-feature styling later)
    expect(
      collection.features.map((feature) => feature.properties?.featureId),
    ).toEqual([
      mockFeatureData[0].featureId,
      mockFeatureData[1].featureId,
      mockFeatureData[2].featureId,
    ]);
    expect(
      collection.features.map((feature) => feature.properties?.layerUuid),
    ).toEqual(["uuid-a", "uuid-b", "uuid-b"]);

    // the geometry itself is passed through untouched
    expect(collection.features[0]!.geometry).toEqual(
      mockFeatureData[0].geometry,
    );
  });

  it("retrieves a dict of popups content arrays by uuid when using getPopupsByUuid", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-a"] = [mockFeatureData[0]];
    featureStore.selectedFeaturesByUuid["uuid-b"] = [
      mockFeatureData[1],
      mockFeatureData[2],
    ];
    const popups = featureStore.getPopupsByUuid;
    expect(Object.keys(popups)).toEqual(["uuid-a", "uuid-b"]);
    expect(popups["uuid-a"].length).toEqual(1);
    expect(popups["uuid-a"]).toEqual([mockFeatureData[0].content]);
    expect(popups["uuid-b"].length).toEqual(2);
    expect(popups["uuid-b"]).toEqual([
      mockFeatureData[1].content,
      mockFeatureData[2].content,
    ]);
  });

  it("retrieves a dict of feature id arrays by uuid when using getFeaturesIdsByUuid", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-a"] = [
      mockFeatureData[0],
      mockFeatureData[1],
    ];
    featureStore.selectedFeaturesByUuid["uuid-b"] = [mockFeatureData[2]];

    const ids = featureStore.getFeaturesIdsByUuid;
    expect(Object.keys(ids)).toEqual(["uuid-a", "uuid-b"]);

    expect(ids["uuid-a"].length).toEqual(2);
    expect(ids["uuid-a"]).toEqual(["feature-id-1", "feature-id-2"]);
    expect(ids["uuid-b"].length).toEqual(1);
    expect(ids["uuid-b"]).toEqual(["feature-id-3"]);
  });

  it("tells us correctly if there are features in the store using hasSelectedFeatures", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-a"] = mockFeatureData;

    expect(featureStore.hasSelectedFeatures).toEqual(true);
  });

  it("tells us correctly if there is no feature in the store using hasSelectedFeatures", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid = {};

    expect(featureStore.hasSelectedFeatures).toEqual(false);
  });

  it("sets correctly feature Data within the store using setSelection", () => {
    const featureStore = useFeaturesStore();
    featureStore.setSelection({
      "uuid-a": [mockFeatureData[0]],
      "uuid-b": [mockFeatureData[1], mockFeatureData[2]],
    });

    expect(Object.keys(featureStore.selectedFeaturesByUuid)).toEqual([
      "uuid-a",
      "uuid-b",
    ]);

    expect(featureStore.selectedFeaturesByUuid["uuid-a"].length).toEqual(1);
    expect(featureStore.selectedFeaturesByUuid["uuid-a"]).toEqual([
      mockFeatureData[0],
    ]);
    expect(featureStore.selectedFeaturesByUuid["uuid-b"].length).toEqual(2);
    expect(featureStore.selectedFeaturesByUuid["uuid-b"]).toEqual([
      mockFeatureData[1],
      mockFeatureData[2],
    ]);
  });

  it("erases previous data when setting Data within the store using setSelection", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-c"] = mockFeatureData;
    featureStore.setSelection({
      "uuid-a": [mockFeatureData[0]],
      "uuid-b": [mockFeatureData[1]],
    });

    expect(Object.keys(featureStore.selectedFeaturesByUuid)).toEqual([
      "uuid-a",
      "uuid-b",
    ]);
  });

  it("does not set uuids with empty featureData array when using setSelection ", () => {
    const featureStore = useFeaturesStore();
    featureStore.setSelection({
      "uuid-a": [mockFeatureData[0]],
      "uuid-b": [],
    });

    expect(Object.keys(featureStore.selectedFeaturesByUuid)).toEqual([
      "uuid-a",
    ]);
  });

  it("erases all data when setting empty data with setSelection", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-a"] = mockFeatureData;
    featureStore.selectedFeaturesByUuid["uuid-b"] = mockFeatureData;
    featureStore.selectedFeaturesByUuid["uuid-c"] = mockFeatureData;

    featureStore.setSelection({
      "uuid-a": [],
      "uuid-b": [],
    });

    expect(featureStore.selectedFeaturesByUuid).toEqual({});
  });

  it("$reset resets the store to its initial state", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-a"] = mockFeatureData;

    featureStore.$reset();

    expect(featureStore.selectedFeaturesByUuid).toEqual({});
  });
});

describe("WMS capability registrations", () => {
  beforeEach(() => setActivePinia(createPinia()));

  const capability: WmsFeatureInfoCapability = {
    getFeatureInfoCapability: {
      baseUrl: "https://example.test/wms?",
      method: "GET",
      formats: ["application/json"],
    },
    wmsVersion: "1.3.0",
    availableCrs: ["EPSG:2056", "EPSG:4326"],
    layerName: null,
  };

  it("starts with no registration, and getWmsCapability returns undefined", () => {
    const featureStore = useFeaturesStore();

    expect(featureStore.wmsCapabilitiesByUuid).toEqual({});
    expect(featureStore.getWmsCapability("uuid-a")).toBeUndefined();
  });

  it("round-trips set / get / clear", () => {
    const featureStore = useFeaturesStore();

    featureStore.setWmsCapability("uuid-a", capability);
    expect(featureStore.getWmsCapability("uuid-a")).toEqual(capability);

    featureStore.clearWmsCapability("uuid-a");
    expect(featureStore.getWmsCapability("uuid-a")).toBeUndefined();
    expect(featureStore.wmsCapabilitiesByUuid).toEqual({});
  });

  it("clearing an unregistered layer is a no-op", () => {
    const featureStore = useFeaturesStore();
    featureStore.setWmsCapability("uuid-a", capability);

    featureStore.clearWmsCapability("uuid-not-registered");

    expect(featureStore.getWmsCapability("uuid-a")).toEqual(capability);
  });

  it("$reset clears the selection but NEVER the capability registrations (binding invariant)", () => {
    const featureStore = useFeaturesStore();
    featureStore.setSelection({ "uuid-a": mockFeatureData });
    featureStore.setWmsCapability("uuid-a", capability);

    featureStore.$reset();

    expect(featureStore.selectedFeaturesByUuid).toEqual({});
    expect(featureStore.getWmsCapability("uuid-a")).toEqual(capability);
  });
});

describe("state sharing functions of the feature store", () => {
  beforeEach(() => setActivePinia(createPinia()));

  const jsonFeature: FeatureData = {
    featureId: "feature-json",
    geometry: { type: "Point", coordinates: [1, 1] },
    content: { kind: "json", properties: {} },
  };
  const nonShareableHtmlFeature: FeatureData = {
    featureId: "feature-html-private",
    geometry: { type: "Point", coordinates: [2, 2] },
    content: {
      kind: "html",
      html: "not shareable",
      trusted: true,
      shareable: false,
    },
  };

  it("addSelection stores the features of a layer when the array is not empty", () => {
    const featureStore = useFeaturesStore();

    featureStore.addSelection("uuid-a", [mockFeatureData[0]!]);

    expect(featureStore.selectedFeaturesByUuid["uuid-a"]).toEqual([
      mockFeatureData[0],
    ]);
  });

  it("addSelection ignores an empty feature array", () => {
    const featureStore = useFeaturesStore();

    featureStore.addSelection("uuid-a", []);

    expect(featureStore.selectedFeaturesByUuid).toEqual({});
    expect(featureStore.hasSelectedFeatures).toBe(false);
  });

  it("consumeFeaturePreselection returns the stored features and clears them", () => {
    const featureStore = useFeaturesStore();
    const identifyFeatures = [
      { id: 1, geometry: { type: "Point" as const, coordinates: [0, 0] } },
    ];
    featureStore.addFeaturePreselection("uuid-a", identifyFeatures);

    expect(featureStore.consumeFeaturePreselection("uuid-a")).toEqual(
      identifyFeatures,
    );
    // the preselection is consumed exactly once
    expect(featureStore.consumeFeaturePreselection("uuid-a")).toBeUndefined();
  });

  it("consumeFeaturePreselection returns undefined for unknown layer uuids", () => {
    const featureStore = useFeaturesStore();

    expect(featureStore.consumeFeaturePreselection("uuid-unknown")).toBe(
      undefined,
    );
  });

  it("getShareableFeaturesIdsByUuid keeps only layers holding shareable html features", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-shareable"] = [
      mockFeatureData[0]!,
    ];
    featureStore.selectedFeaturesByUuid["uuid-json"] = [jsonFeature];
    featureStore.selectedFeaturesByUuid["uuid-html-private"] = [
      nonShareableHtmlFeature,
    ];

    const shareableIds = featureStore.getShareableFeaturesIdsByUuid;

    expect(Object.keys(shareableIds)).toEqual(["uuid-shareable"]);
    expect(shareableIds["uuid-shareable"]).toEqual(["feature-id-1"]);
  });

  it("getShareableFeaturesIdsByUuid keeps a layer as soon as one of its features is shareable", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-mixed"] = [
      mockFeatureData[0]!,
      jsonFeature,
    ];

    expect(Object.keys(featureStore.getShareableFeaturesIdsByUuid)).toEqual([
      "uuid-mixed",
    ]);
  });

  it("getShareableFeaturesIdsByUuid is empty when nothing is selected", () => {
    const featureStore = useFeaturesStore();

    expect(featureStore.getShareableFeaturesIdsByUuid).toEqual({});
  });
});
