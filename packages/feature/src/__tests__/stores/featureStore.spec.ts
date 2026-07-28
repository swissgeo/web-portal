import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import type { FeatureData } from "@/types";

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
    expect(featureStore.getSelectedGeometries).toEqual([]);
    expect(featureStore.hasSelectedFeatures).toEqual(false);
  });

  it("retrieves a list of all geometries when using getSelectedGeometries", () => {
    const featureStore = useFeaturesStore();
    featureStore.selectedFeaturesByUuid["uuid-a"] = [mockFeatureData[0]];
    featureStore.selectedFeaturesByUuid["uuid-b"] = [
      mockFeatureData[1],
      mockFeatureData[2],
    ];

    const geometries = featureStore.getSelectedGeometries;
    expect(geometries.length).toEqual(3);
    expect(geometries.map((geometry) => geometry.type)).toEqual([
      "Point",
      "Point",
      "Point",
    ]);
    expect(geometries.map((geometry) => geometry.coordinates)).toEqual([
      [0, 0],
      [9, 4],
      [12, 12],
    ]);
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
