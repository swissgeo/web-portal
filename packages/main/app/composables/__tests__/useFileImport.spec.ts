import { useLayerStore } from "@swissgeo/layers";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFileImport } from "../useFileImport";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "toolbox.import.errorMessages.fileTooLarge") {
        return `File too large: ${String(params?.fileName)} (max ${String(params?.maxSize)}MB)`;
      }
      return key;
    },
  }),
}));

const makeFile = (name: string, content = "<data/>") =>
  new File([content], name);

function makeBytePattern(size: number): Uint8Array {
  const bytes = new Uint8Array(size);

  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = index % 256;
  }

  return bytes;
}

describe("useFileImport", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000000",
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const geoJson = '{"type":"FeatureCollection","features":[]}';
  // Obsolete per RFC 7946, but a lot of our internal GeoJSON still carries it.
  const geoJsonWithCrs = JSON.stringify({
    type: "FeatureCollection",
    crs: { type: "name", properties: { name: "EPSG:2056" } },
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [2600000, 1200000] },
      },
    ],
  });

  it.each([
    ["drawing.kml", "kml", "<kml/>"],
    ["drawing.gpx", "gpx", "<gpx/>"],
    ["drawing.geojson", "geojson", geoJson],
    ["drawing.json", "geojson", geoJson],
    ["lufttemperatur.geojson", "geojson", geoJsonWithCrs],
    // extension detection is case-insensitive
    ["DRAWING.KML", "kml", "<kml/>"],
  ])(
    "imports %s as a %s layer with the file contents",
    async (name, type, content) => {
      const { importFile } = useFileImport();
      const store = useLayerStore();

      await importFile(makeFile(name, content));

      expect(store.layers).toHaveLength(1);
      const layer = store.layers[0]!;
      expect(layer.type).toBe(type);
      expect(layer.humanId).toBe(name);
      expect(layer.info?.displayName).toBe(name);
      expect(layer.data).toBe(content);
      expect(layer.uuid).toBe("00000000-0000-4000-8000-000000000000");
    },
  );

  it("imports KMZ files as binary data", async () => {
    const bytes = makeBytePattern(200_000);
    const file = new File([bytes.buffer as ArrayBuffer], "large.kmz", {
      type: "application/vnd.google-earth.kmz",
    });

    await useFileImport().importFile(file);

    expect(useLayerStore().layers).toEqual([
      expect.objectContaining({
        data: bytes,
        humanId: "large.kmz",
        type: "kmz",
        uuid: "00000000-0000-4000-8000-000000000000",
      }),
    ]);
  });

  it("throws on an unsupported file type and adds no layer", async () => {
    const { importFile } = useFileImport();
    const store = useLayerStore();

    await expect(importFile(makeFile("notes.txt"))).rejects.toThrow(
      "Unsupported file type: notes.txt",
    );
    expect(store.layers).toHaveLength(0);
  });

  it.each([
    ["unparseable JSON", "{ not valid json"],
    ["JSON that is not GeoJSON", '{"title":"un JSON standard"}'],
    ["a FeatureCollection without features", '{"type":"FeatureCollection"}'],
    [
      "a FeatureCollection holding non-features",
      '{"type":"FeatureCollection","features":[{"type":"Point"}]}',
    ],
    [
      "a feature with an unsupported geometry",
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Banana","coordinates":[1,2]}}]}',
    ],
  ])("throws on %s and adds no layer", async (_label, content) => {
    const { importFile } = useFileImport();
    const store = useLayerStore();

    await expect(
      importFile(makeFile("broken.geojson", content)),
    ).rejects.toThrow("Invalid GeoJSON file: broken.geojson");
    expect(store.layers).toHaveLength(0);
  });

  it("rejects files exceeding the size limit", async () => {
    const { importFile } = useFileImport();
    const store = useLayerStore();

    const file = makeFile("huge.kml", "<kml/>");
    Object.defineProperty(file, "size", { value: 51 * 1024 * 1024 });

    await expect(importFile(file)).rejects.toThrow("File too large");
    expect(store.layers).toHaveLength(0);
  });

  it("accepts files at exactly the size limit", async () => {
    const { importFile } = useFileImport();
    const store = useLayerStore();

    const file = makeFile("limit.kml", "<kml/>");
    Object.defineProperty(file, "size", { value: 50 * 1024 * 1024 });

    await importFile(file);

    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("kml");
  });

  it("accepts files below the size limit", async () => {
    const { importFile } = useFileImport();
    const store = useLayerStore();

    const file = makeFile("small.kml", "<kml/>");
    Object.defineProperty(file, "size", { value: 1024 });

    await importFile(file);

    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("kml");
  });
});
