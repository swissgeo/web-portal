import type { Dataset } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { shallowMount } from "@vue/test-utils";
import ImportLayersPanel from "~/components/debug/ImportLayersPanel.vue";
import { describe, expect, it, vi } from "vitest";

const wmtsCapabilities = `<?xml version="1.0" encoding="UTF-8"?>
<Capabilities xmlns="http://www.opengis.net/wmts/1.0" version="1.0.0">
    <Contents>
        <Layer>
            <ows:Title xmlns:ows="http://www.opengis.net/ows/1.1">Layer A</ows:Title>
            <ows:Identifier xmlns:ows="http://www.opengis.net/ows/1.1">layer-a</ows:Identifier>
        </Layer>
        <Layer>
            <ows:Title xmlns:ows="http://www.opengis.net/ows/1.1">Layer B</ows:Title>
            <ows:Identifier xmlns:ows="http://www.opengis.net/ows/1.1">layer-b</ows:Identifier>
        </Layer>
    </Contents>
</Capabilities>`;

const fetchSpy = vi.fn(() => Promise.resolve(wmtsCapabilities));
(globalThis as Record<string, unknown>).$fetch = fetchSpy;

const addLayerSpy = vi.fn();
const makeServerLayerSpy = vi.fn((_layer: Dataset) => ({
  id: _layer.id,
  dataset: _layer,
}));

vi.mock("@swissgeo/layers", () => ({
  makeServerLayer: (_dataset: Dataset) => makeServerLayerSpy(_dataset),
  useLayerStore: () => ({ addLayer: addLayerSpy }),
}));

vi.mock("@swissgeo/skeleton", () => ({
  IconButton: { template: "<button><slot /></button>" },
}));

mockNuxtImport("useRequestURL", () => () => new URL("http://localhost:3000/"));

interface PanelVm {
  importUrl: string;
  layers: string[];
  loadCapabilities: () => Promise<void>;
  addLayer: (_layer: string) => void;
}

describe("ImportLayersPanel.vue", () => {
  it("extracts WMTS layer identifiers from the capabilities response", async () => {
    const wrapper = shallowMount(ImportLayersPanel);
    const vm = wrapper.vm as unknown as PanelVm;
    vm.importUrl = "https://wmts.example.com/1.0.0/WMTSCapabilities.xml";

    await vm.loadCapabilities();

    expect(fetchSpy).toHaveBeenCalledWith(vm.importUrl);
    expect(vm.layers).toEqual(["layer-a", "layer-b"]);
  });

  it("builds a dataset with a self link and adds it to the layer store", async () => {
    const wrapper = shallowMount(ImportLayersPanel);
    const vm = wrapper.vm as unknown as PanelVm;
    vm.importUrl = "https://wmts.example.com/1.0.0/WMTSCapabilities.xml";

    await vm.loadCapabilities();
    addLayerSpy.mockClear();
    makeServerLayerSpy.mockClear();

    vm.addLayer("layer-a");

    expect(makeServerLayerSpy).toHaveBeenCalledTimes(1);
    const dataset = makeServerLayerSpy.mock.calls[0]![0];
    const links = dataset.links ?? [];

    const expectedEncoded = encodeURIComponent(vm.importUrl);
    const selfLink = links.find((l) => l.rel === "self");
    expect(selfLink?.href).toBe(
      `/api/wpa/v1/layers/external/dataset/${expectedEncoded}/layer-a`,
    );

    const distributionsLink = links.find((l) => l.rel === "distributions");
    expect(distributionsLink?.href).toBe(
      `/api/wpa/v1/layers/external/${expectedEncoded}/layer-a`,
    );

    expect(dataset.id).toBe("layer-a");
    expect(dataset.properties.title).toBe("layer-a on wmts.example.com");
    expect(addLayerSpy).toHaveBeenCalledTimes(1);
  });

  it("throws if addLayer is called before a layer type is determined", () => {
    const wrapper = shallowMount(ImportLayersPanel);
    const vm = wrapper.vm as unknown as PanelVm;

    expect(() => vm.addLayer("layer-a")).toThrow(
      /Layer type must be determined before adding a layer/,
    );
  });
});
