import type { Mock } from "vitest";

import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { computed, defineComponent, nextTick } from "vue";

import BaseMapViewer from "../BaseMapViewer.vue";

type FeatureStoreState = {
  hasSelectedFeatures: boolean;
  $reset: Mock;
};

const { getFeatureStoreState, setFeatureStoreState } = vi.hoisted(() => {
  let state: FeatureStoreState | null = null;
  return {
    getFeatureStoreState: () => state!,
    setFeatureStoreState: (built: FeatureStoreState) => {
      state = built;
    },
  };
});

vi.mock("@swissgeo/feature", async () => {
  const { reactive } = await import("vue");
  const state: FeatureStoreState = reactive({
    hasSelectedFeatures: false,
    $reset: vi.fn(() => {
      state.hasSelectedFeatures = false;
    }),
  });
  setFeatureStoreState(state);
  return {
    selectFeatures: vi.fn(),
    FEATURE_LIMIT: 10,
    useFeaturesStore: () => state,
  };
});

const mockLayers = [
  {
    uuid: "layer-1",
    layerId: "1",
    displayName: "Layer 1",
    opacity: undefined,
  },
  {
    uuid: "layer-2",
    layerId: "2",
    displayName: "Layer 2",
    opacity: 0.5,
  },
  {
    uuid: "layer-3",
    layerId: "3",
    displayName: "Layer 3",
    opacity: null,
  },
  {
    uuid: "layer-4",
    layerId: "4",
    displayName: "Layer 4",
    opacity: 1,
  },
];

const mockBackgroundLayer = {
  uuid: "layer-1",
};

const getMapLayers = vi.fn(() => computed(() => mockLayers));

mockNuxtImport("useMapViewStore", () => {
  return () => ({
    getMapLayers,
  });
});
vi.mock("@swissgeo/layers", () => {
  return {
    useLayerStore: () => ({
      layers: mockLayers,
      backgroundLayer: mockBackgroundLayer,
    }),
  };
});

vi.mock("~/stores/mapViewStore", () => ({
  useMapViewStore: () => ({
    getMapLayers,
  }),
}));

const SourceToMapDataConverterStub = defineComponent({
  name: "SourceToMapDataConverter",
  props: ["sourceBgLayer", "sourceData"],
  template: "<div data-testid='converter' />",
});

const ToolboxStub = defineComponent({
  name: "Toolbox",
  template: "<div data-testid='toolbox' />",
});

const FeatureInfoPopoverStub = defineComponent({
  name: "FeaturesinfoFeatureInfoPopover",
  emits: ["close"],
  template: "<div data-testid='feature-info-popover' />",
});

const MapModuleStub = defineComponent({
  name: "MapModule",
  props: [
    "layers",
    "customLayerRenderers",
    "displayMode",
    "compareSliderActive",
    "compareRatio",
    "compareSliderClippedLayer",
    "zoomOnlyCtrl",
  ],
  emits: ["update:compare-ratio"],
  template: `
    <div data-testid="map-module">
      <slot />
      <slot name="map-ui" />
      <slot
        name="context-menu-popup"
        :foo="'bar'"
      />
    </div>
  `,
});

describe("BaseMapViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLayers[0]!.opacity = undefined;
    mockLayers[1]!.opacity = 0.5;
    mockLayers[2]!.opacity = null;
    mockLayers[3]!.opacity = 1;

    getFeatureStoreState().hasSelectedFeatures = false;
  });

  async function createWrapper(props = {}) {
    return await mountSuspended(BaseMapViewer, {
      props,
      global: {
        stubs: {
          ClientOnly: {
            template: "<div><slot /></div>",
          },
          MapModule: MapModuleStub,
          SourceToMapDataConverter: SourceToMapDataConverterStub,
          Toolbox: ToolboxStub,
          FeaturesinfoFeatureInfoPopover: FeatureInfoPopoverStub,
        },
      },
    });
  }

  it("renders correctly the various components", async () => {
    const wrapper = await createWrapper();

    expect(wrapper.find("[data-testid='map-module']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='converter']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='toolbox']").exists()).toBe(true);
  });

  it("does not render the Toolbox when in print mode", async () => {
    const wrapper = await createWrapper({
      displayMode: "print",
    });

    expect(wrapper.find("[data-testid='toolbox']").exists()).toBe(false);
  });

  describe("feature info popover", () => {
    it("is not rendered without a selection", async () => {
      const wrapper = await createWrapper();

      expect(
        wrapper.find("[data-testid='feature-info-popover']").exists(),
      ).toBe(false);
    });

    it("is rendered when the feature store has a selection", async () => {
      const wrapper = await createWrapper();
      getFeatureStoreState().hasSelectedFeatures = true;
      await nextTick();

      expect(
        wrapper.find("[data-testid='feature-info-popover']").exists(),
      ).toBe(true);
    });

    it("is not rendered in print mode even with a selection", async () => {
      getFeatureStoreState().hasSelectedFeatures = true;

      const wrapper = await createWrapper({ displayMode: "print" });

      expect(
        wrapper.find("[data-testid='feature-info-popover']").exists(),
      ).toBe(false);
    });

    it("resets the feature store and unmounts when the popover emits close", async () => {
      getFeatureStoreState().hasSelectedFeatures = true;
      const wrapper = await createWrapper();
      expect(
        wrapper.find("[data-testid='feature-info-popover']").exists(),
      ).toBe(true);

      wrapper.getComponent(FeatureInfoPopoverStub).vm.$emit("close");
      await nextTick();

      expect(getFeatureStoreState().$reset).toHaveBeenCalledOnce();
      expect(getFeatureStoreState().hasSelectedFeatures).toBe(false);
      expect(
        wrapper.find("[data-testid='feature-info-popover']").exists(),
      ).toBe(false);
    });
  });

  it("passes source data to SourceToMapDataConverter", async () => {
    const wrapper = await createWrapper();

    const converter = wrapper.getComponent(SourceToMapDataConverterStub);

    expect(converter.props("sourceData")).toEqual(mockLayers);
    expect(converter.props("sourceBgLayer")).toEqual(mockBackgroundLayer);
  });

  it("passes computed layers to MapModule", async () => {
    const wrapper = await createWrapper(mockLayers);

    const map = wrapper.getComponent(MapModuleStub);
    const layers = map.props("layers");
    expect(layers).toHaveLength(4);

    expect(layers[0].opacity).toBe(1);
    expect(layers[1].opacity).toBe(0.5);
    expect(layers[2].opacity).toBe(1);
    expect(layers[3].opacity).toBe(1);
  });

  it("sets opacity directly on background layer", async () => {
    const wrapper = await createWrapper();

    const map = wrapper.getComponent(MapModuleStub);

    const layers = map.props("layers");

    expect(layers[0]).toBe(mockLayers[0]);
    expect(mockLayers[0]!.opacity).toBe(1);
  });

  it("emits update:compareRatio", async () => {
    const wrapper = await createWrapper();

    wrapper.getComponent(MapModuleStub).vm.$emit("update:compare-ratio", 42);

    expect(wrapper.emitted("update:compareRatio")).toEqual([[42]]);
  });

  it("passes compare slider props", async () => {
    const clippedLayer = {
      uuid: "uuid",
      layerId: "id",
      displayName: "Layer",
    };

    const wrapper = await createWrapper({
      compareSliderActive: true,
      compareRatio: 35,
      compareSliderClippedLayer: clippedLayer,
      zoomOnlyCtrl: true,
      displayMode: "mobile",
    });

    const map = wrapper.getComponent(MapModuleStub);

    expect(map.props("compareSliderActive")).toBe(true);
    expect(map.props("compareRatio")).toBe(35);
    expect(map.props("compareSliderClippedLayer")).toEqual(clippedLayer);
    expect(map.props("zoomOnlyCtrl")).toBe(true);
    expect(map.props("displayMode")).toBe("mobile");
  });

  it("renders map-ui slot", async () => {
    const wrapper = await mountSuspended(BaseMapViewer, {
      global: {
        stubs: {
          ClientOnly: {
            template: "<div><slot /></div>",
          },
          MapModule: MapModuleStub,
          SourceToMapDataConverter: SourceToMapDataConverterStub,
          Toolbox: ToolboxStub,
        },
      },
      slots: {
        "map-ui": "<div id='slot-content'>Hello</div>",
      },
    });

    expect(wrapper.find("#slot-content").exists()).toBe(true);
  });

  it("renders context-menu-popup slot", async () => {
    const wrapper = await mountSuspended(BaseMapViewer, {
      global: {
        stubs: {
          ClientOnly: {
            template: "<div><slot /></div>",
          },
          MapModule: MapModuleStub,
          SourceToMapDataConverter: SourceToMapDataConverterStub,
          Toolbox: ToolboxStub,
        },
      },
      slots: {
        "context-menu-popup": `
          <template #default="{ foo }">
            <div id="popup">{{ foo }}</div>
          </template>
        `,
      },
    });

    expect(wrapper.find("#popup").text()).toBe("bar");
  });
});
