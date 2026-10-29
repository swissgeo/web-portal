import type { Layer } from "@swissgeo/layers";

import { mount } from "@vue/test-utils";
import LayersPanelEntry from "~/components/debug/LayersPanelEntry.vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed } from "vue";

const { addLayerMock, makeServerLayerMock } = vi.hoisted(() => ({
  addLayerMock: vi.fn(),
  makeServerLayerMock: vi.fn(),
}));

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({
    addLayer: addLayerMock,
  }),
  makeServerLayer: makeServerLayerMock,
}));

describe("LayersPanelEntry.vue", () => {
  beforeEach(() => {
    addLayerMock.mockReset();
    makeServerLayerMock.mockReset();
    vi.stubGlobal("computed", computed);

    makeServerLayerMock.mockImplementation(
      (dataset: {
        id: string;
        properties?: {
          attribution?: { abbreviation: string; name: string };
        };
      }) => {
        return {
          humanId: dataset.id,
          info: {
            displayName: dataset.id,
            attribution: dataset.properties?.attribution,
          },
        } as Layer;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds a layer using already mapped dataset attribution", async () => {
    const wrapper = mount(LayersPanelEntry, {
      props: {
        dataset: {
          id: "ch.layer.one",
          links: [
            {
              rel: "distributions",
              href: "https://example.test/distributions",
              title: "distributions",
            },
          ],
          properties: {
            type: "Dataset",
            title: "Layer title",
            attribution: { abbreviation: "OGC", name: "OGC source" },
            preferredDistributionId: "OGC:WMTS:ch.layer.one",
          },
        } as never,
      },
      global: {
        stubs: {
          UButton: {
            inheritAttrs: false,
            template: "<button v-bind='$attrs'><slot /></button>",
          },
        },
      },
    });

    await wrapper.find("button").trigger("click");

    expect(addLayerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        info: expect.objectContaining({
          attribution: {
            abbreviation: "OGC",
            name: "OGC source",
          },
        }),
      }),
    );
  });
});
