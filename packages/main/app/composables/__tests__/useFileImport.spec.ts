import { mockNuxtImport } from "@nuxt/test-utils/runtime";
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
      if (key === "toolbox.import.errorMessages.unsupportedUrlType") {
        return `Unsupported file type. URL must end with ${String(params?.types)}`;
      }
      if (key === "toolbox.import.errorMessages.fetchFailed") {
        return `Failed to fetch file from URL (HTTP ${String(params?.status)})`;
      }
      return key;
    },
  }),
}));

mockNuxtImport("useRuntimeConfig", () => () => ({
  public: {
    maxFileSizeMB: 50,
  },
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

  it("imports .tif files as COG with File object", async () => {
    const file = makeFile("satellite.tif", "fake-tif-data");
    const { importFile } = useFileImport();
    const store = useLayerStore();

    await importFile(file);

    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("cog");
    expect(store.layers[0]!.data).toBeInstanceOf(File);
  });

  it("imports .tiff files as COG", async () => {
    const file = makeFile("satellite.tiff", "fake-tif-data");
    const { importFile } = useFileImport();
    const store = useLayerStore();

    await importFile(file);

    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("cog");
  });
});

describe("useFileImport - importFileUrl", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000000",
    );
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("imports a KML file from URL", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<kml/>"),
    });

    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await importFileUrl("https://example.com/data.kml");

    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("kml");
    expect(store.layers[0]!.data).toBe("<kml/>");
    expect(store.layers[0]!.info?.displayName).toBe("data.kml");
  });

  it("imports a GPX file from URL", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<gpx/>"),
    });

    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await importFileUrl("https://example.com/track.gpx");

    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("gpx");
    expect(store.layers[0]!.data).toBe("<gpx/>");
  });

  it("imports a GeoJSON file from URL", async () => {
    const geoJson = '{"type":"FeatureCollection","features":[]}';
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(geoJson),
    });

    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await importFileUrl("https://example.com/data.geojson");

    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("geojson");
    expect(store.layers[0]!.data).toBe(geoJson);
  });

  it("imports a KMZ file from URL as Uint8Array", async () => {
    const bytes = new Uint8Array([80, 75, 3, 4]);
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(bytes.buffer),
    });

    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await importFileUrl("https://example.com/data.kmz");

    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("kmz");
    expect(store.layers[0]!.data).toBeInstanceOf(Uint8Array);
  });

  it("stores URL as sourceUrl for COG (.tif) without fetching", async () => {
    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await importFileUrl("https://example.com/satellite.tif");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("cog");
    expect(store.layers[0]!.sourceUrl).toBe(
      "https://example.com/satellite.tif",
    );
    expect(store.layers[0]!.data).toBeUndefined();
  });

  it("stores URL directly for COG (.tiff) without fetching", async () => {
    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await importFileUrl("https://example.com/satellite.tiff");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("cog");
  });

  it("throws for URL with no recognized extension", async () => {
    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await expect(importFileUrl("https://example.com/data.bin")).rejects.toThrow(
      "Unsupported file type",
    );

    expect(store.layers).toHaveLength(0);
  });

  it("throws for invalid URL", async () => {
    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await expect(importFileUrl("not-a-url")).rejects.toThrow(
      "Unsupported file type",
    );
    expect(store.layers).toHaveLength(0);
  });

  it("throws on HTTP error response", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await expect(importFileUrl("https://example.com/data.kml")).rejects.toThrow(
      "Failed to fetch file from URL (HTTP 404)",
    );
    expect(store.layers).toHaveLength(0);
  });

  it("throws on invalid GeoJSON content from URL", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("not valid geojson"),
    });

    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await expect(
      importFileUrl("https://example.com/data.geojson"),
    ).rejects.toThrow("Invalid GeoJSON content from");
    expect(store.layers).toHaveLength(0);
  });

  it("handles .json extension as GeoJSON", async () => {
    const geoJson = '{"type":"FeatureCollection","features":[]}';
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(geoJson),
    });

    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await importFileUrl("https://example.com/data.json");

    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.type).toBe("geojson");
  });

  it("extracts display name from URL path", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<kml/>"),
    });

    const { importFileUrl } = useFileImport();
    const store = useLayerStore();

    await importFileUrl("https://example.com/path/to/my-map.kml");

    expect(store.layers[0]!.info?.displayName).toBe("my-map.kml");
  });
});
