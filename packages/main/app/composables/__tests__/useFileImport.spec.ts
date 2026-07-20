import { useLayerStore } from "@swissgeo/layers";
import { useFileImport } from "~/composables/useFileImport";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

const makeFile = (name: string, content = "<data/>") =>
  new File([content], name);

describe("useFileImport", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it.each([
    ["drawing.kml", "kml"],
    ["drawing.gpx", "gpx"],
    ["drawing.geojson", "geojson"],
    ["drawing.json", "geojson"],
    // extension detection is case-insensitive
    ["DRAWING.KML", "kml"],
  ])("imports %s as a %s layer with the file contents", async (name, type) => {
    const { importFile } = useFileImport();
    const store = useLayerStore();

    await importFile(makeFile(name, "file-content"));

    expect(store.layers).toHaveLength(1);
    const layer = store.layers[0]!;
    expect(layer.type).toBe(type);
    expect(layer.humanId).toBe(name);
    expect(layer.info?.displayName).toBe(name);
    expect(layer.data).toBe("file-content");
    expect(layer.uuid).toEqual(expect.any(String));
  });

  it("stores KMZ data as base64", async () => {
    const { importFile } = useFileImport();
    const store = useLayerStore();

    await importFile(makeFile("drawing.kmz", "kmz-bytes"));

    const layer = store.layers[0]!;
    expect(layer.type).toBe("kmz");
    expect(layer.data).toBe(btoa("kmz-bytes"));
  });

  it("throws on an unsupported file type and adds no layer", async () => {
    const { importFile } = useFileImport();
    const store = useLayerStore();

    await expect(importFile(makeFile("notes.txt"))).rejects.toThrow(
      "Unsupported file type: notes.txt",
    );
    expect(store.layers).toHaveLength(0);
  });
});
