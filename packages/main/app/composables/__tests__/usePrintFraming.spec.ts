import type { AppStatePayload } from "~/composables/useStateConfig";
import type { Ref } from "vue";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises, mount } from "@vue/test-utils";
import { usePrintFraming } from "~/composables/usePrintFraming";
import { URL_PARAM_STATE } from "~/composables/useUrlParams";
import { PRINT_DPI } from "~/types/print";
import {
  getResolutionForScale,
  getScaleForResolution,
} from "~/utils/printUtils";
import Polygon from "ol/geom/Polygon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";

const {
  mockAddLayer,
  mockCreateCutoutGeometry,
  mockRemoveLayer,
  mockRenderSync,
  mockSendCustomPrintRequest,
  mockSetCenter,
  mockSetZoom,
  mockShowWarning,
  mockToasterRemove,
  mockMakeUseOfCurrentLayers,
  mockUseCreateShareLinkForCustomState,
  mockUseCustomStateConfig,
  mockUseI18n,
  mockUseMap,
  mockUseToaster,
} = vi.hoisted(() => ({
  mockAddLayer: vi.fn(),
  mockCreateCutoutGeometry: vi.fn(),
  mockRemoveLayer: vi.fn(),
  mockRenderSync: vi.fn(),
  mockSendCustomPrintRequest: vi.fn(),
  mockSetCenter: vi.fn(),
  mockSetZoom: vi.fn(),
  mockShowWarning: vi.fn(),
  mockToasterRemove: vi.fn(),
  mockMakeUseOfCurrentLayers: vi.fn(),
  mockUseCreateShareLinkForCustomState: vi.fn(),
  mockUseCustomStateConfig: vi.fn(),
  mockUseI18n: vi.fn(),
  mockUseMap: vi.fn(),
  mockUseToaster: vi.fn(),
}));

mockNuxtImport("useCreateShareLinkForCustomState", () => {
  return mockUseCreateShareLinkForCustomState;
});
mockNuxtImport("useCustomStateConfig", () => mockUseCustomStateConfig);
mockNuxtImport("useI18n", () => mockUseI18n);
mockNuxtImport("useToaster", () => mockUseToaster);

vi.mock("@swissgeo/coordinates", async (importOriginal) => ({
  ...(await importOriginal()),
  createCutoutGeometry: mockCreateCutoutGeometry,
}));

vi.mock("@swissgeo/map", () => ({
  useMap: mockUseMap,
}));

vi.mock("../usePrintRequests", () => ({
  usePrintRequests: () => ({
    sendCustomPrintRequest: mockSendCustomPrintRequest,
  }),
}));

function makeState(): AppStatePayload {
  return {
    version: "1.0",
    state: {
      map: {
        center: [2_600_000, 1_200_000],
        zoom: 8,
        rotation: 0,
      },
      layers: [],
    },
  };
}

const zoomOfScale = (scale: number) =>
  8 - Math.log2(getResolutionForScale(scale, PRINT_DPI));

// width in map units of the frame that was drawn last
const lastFrameWidth = () => {
  const extent = mockCreateCutoutGeometry.mock.calls.at(-1)?.[1] as number[];
  return (extent[2] as number) - (extent[0] as number);
};

describe("usePrintFraming", () => {
  let center: Ref<[number, number]>;
  let customStateConfig: Ref<AppStatePayload>;
  let customStateMapCenter: Ref<[number, number]>;
  let customStateMapZoom: Ref<number>;
  let backgroundLayerStateConfig: Ref<object | null>;
  let hash: Ref<string | null>;
  let olMap: Ref<object | null>;
  let portableState: Ref<AppStatePayload | null>;
  let viewportExtent: Ref<[number, number, number, number]>;
  let zoomLevel: Ref<number>;

  const view = {
    getCenter: vi.fn(() => center.value),
    getResolutionForZoom: vi.fn((zoom: number) => 2 ** (8 - zoom)),
    getZoomForResolution: vi.fn(
      (resolution: number) => 8 - Math.log2(resolution),
    ),
    getZoom: vi.fn(() => 8),
    setCenter: mockSetCenter,
    setZoom: mockSetZoom,
  };

  const map = {
    addLayer: mockAddLayer,
    getView: () => view,
    removeLayer: mockRemoveLayer,
    renderSync: mockRenderSync,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    center = ref([2_600_000, 1_200_000]);
    zoomLevel = ref(8);
    viewportExtent = ref([2_400_000, 1_000_000, 2_850_000, 1_350_000]);
    olMap = ref(map);
    customStateConfig = ref(makeState());
    customStateMapCenter = ref([0, 0]);
    customStateMapZoom = ref(0);
    backgroundLayerStateConfig = ref(null);
    hash = ref(null);
    portableState = ref(null);

    mockCreateCutoutGeometry.mockReturnValue(
      new Polygon([
        [
          [2_599_000, 1_199_000],
          [2_601_000, 1_199_000],
          [2_601_000, 1_201_000],
          [2_599_000, 1_201_000],
          [2_599_000, 1_199_000],
        ],
      ]),
    );
    mockUseI18n.mockReturnValue({
      locale: ref("EN"),
      t: vi.fn((key: string) => key),
    });
    mockUseToaster.mockReturnValue({
      remove: mockToasterRemove,
      showWarning: mockShowWarning,
    });
    mockUseCustomStateConfig.mockReturnValue({
      customStateConfig,
      customStateMapCenter,
      customStateMapZoom,
      backgroundLayerStateConfig,
      makeUseOfCurrentLayers: mockMakeUseOfCurrentLayers,
    });
    mockUseCreateShareLinkForCustomState.mockReturnValue({
      hash,
      state: portableState,
    });
    mockUseMap.mockReturnValue({
      center,
      olMap,
      viewportExtent,
      zoomLevel,
    });
    mockSendCustomPrintRequest.mockResolvedValue(undefined);
  });

  function mountComposable() {
    let framing!: ReturnType<typeof usePrintFraming>;
    const wrapper = mount(
      defineComponent({
        setup() {
          framing = usePrintFraming();
          return () => h("div");
        },
      }),
    );
    return { framing, wrapper };
  }

  it("computes the default framing and manages its map layer lifecycle", () => {
    const { framing, wrapper } = mountComposable();

    expect(framing.pageSizeInPixels.value).toEqual({
      width: 1123,
      height: 794,
    });
    expect(framing.centerForPrint.value).toEqual([2_600_000, 1_200_000]);
    expect(framing.zoomLevelForPrint.value).toBe(8);
    // a screen at 96 dpi showing 1 m per pixel is at 1:3'780
    expect(framing.scaleOfPrint.value).toBeCloseTo(96 / 0.0254);
    expect(framing.scaleOfPrintFormatted.value).toBe("1:3780");
    expect(customStateMapCenter.value).toEqual([2_600_000, 1_200_000]);
    expect(customStateMapZoom.value).toBe(8);
    expect(mockCreateCutoutGeometry).toHaveBeenCalled();
    expect(mockRenderSync).toHaveBeenCalled();
    expect(mockAddLayer).toHaveBeenCalledOnce();

    wrapper.unmount();

    expect(mockRemoveLayer).toHaveBeenCalledOnce();
  });

  it("locks framing coordinates and adjusts the live map back to them", async () => {
    const { framing, wrapper } = mountComposable();
    framing.isCenterLocked.value = true;
    framing.isZoomLocked.value = true;

    center.value = [2_650_000, 1_250_000];
    zoomLevel.value = 10;
    await nextTick();

    expect(framing.centerForPrint.value).toEqual([2_600_000, 1_200_000]);
    expect(framing.zoomLevelForPrint.value).toBe(8);
    expect(framing.isAtLockedZoomLevel.value).toBe(false);

    framing.adjustToLockedView();

    expect(mockSetCenter).toHaveBeenCalledWith([2_600_000, 1_200_000]);
    expect(mockSetZoom).toHaveBeenCalledWith(8);

    wrapper.unmount();
  });

  it("builds a preview URL and sends the matching request when ready", async () => {
    const { framing, wrapper } = mountComposable();

    framing.selectedPrintFormat.value = "a3";
    framing.selectedPrintOrientation.value = "portrait";
    framing.updatePrintState();

    expect(portableState.value).toEqual(customStateConfig.value);
    expect(framing.printPreviewUrl.value).toBeNull();
    expect(framing.isReadyToPrint.value).toBe(false);

    hash.value = "print-state";
    await nextTick();
    await flushPromises();

    const previewUrl = new URL(framing.printPreviewUrl.value!);
    expect(previewUrl.pathname).toBe("/en/print");
    expect(previewUrl.searchParams.get(URL_PARAM_STATE)).toBe("print-state");
    expect(previewUrl.searchParams.get("print_format")).toBe("a3");
    expect(previewUrl.searchParams.get("print_orientation")).toBe("portrait");
    expect(previewUrl.searchParams.get("print_resolution")).toBe("96");
    // wysiwyg prints the zoom of the state, without a scale
    expect(previewUrl.searchParams.has("print_scale")).toBe(false);
    expect(mockSendCustomPrintRequest).toHaveBeenCalledWith({
      state_id: "print-state",
      print_format: "a3",
      print_orientation: "portrait",
      print_resolution: 96,
      print_legend: false,
      print_grid: false,
      print_lang: "en",
    });
    expect(portableState.value).toBeNull();

    wrapper.unmount();
  });

  it("marks out-of-bounds and off-screen framing as not printable", async () => {
    const { framing, wrapper } = mountComposable();
    hash.value = "print-state";
    center.value = [0, 0];
    viewportExtent.value = [2_599_900, 1_199_900, 2_600_100, 1_200_100];
    await nextTick();

    expect(framing.isPrintExtentOutOfBounds.value).toBe(true);
    expect(framing.isPrintExtentBeyondViewport.value).toBe(true);
    expect(framing.isReadyToPrint.value).toBe(false);
    expect(mockShowWarning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        id: "warning_print_extent_out_of_bounds",
      }),
    );
    expect(mockShowWarning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        id: "warning_print_extent_beyond_viewport",
      }),
    );

    wrapper.unmount();
  });

  describe("fixed-scale mode", () => {
    it("frames the exact real-world size of the scale, whatever the screen zoom", async () => {
      const { framing } = mountComposable();
      framing.selectedPrintMode.value = "fixed-scale";
      await nextTick();
      framing.selectedPrintScale.value = 25000;
      await nextTick();

      // A4 landscape is 297 mm wide, so 1:25'000 covers 7'425 m
      expect(framing.scaleOfPrint.value).toBeCloseTo(25000, -1);
      expect(framing.isAtLockedZoomLevel.value).toBe(true);
      // the state keeps a whole zoom level, the print page draws print_scale exactly
      expect(customStateMapZoom.value).toBe(Math.round(zoomOfScale(25000)));

      zoomLevel.value = 12;
      await nextTick();
      expect(framing.scaleOfPrint.value).toBeCloseTo(25000, -1);
    });

    it("prints the layers currently active, and sends the scale", async () => {
      const activeBackground = { layerUrl: "catalog/whatever-is-active" };
      backgroundLayerStateConfig.value = activeBackground;
      const { framing } = mountComposable();
      framing.selectedPrintMode.value = "fixed-scale";
      await nextTick();
      framing.selectedPrintScale.value = 50000;
      await nextTick();

      // the background of the state is the one on screen, not one picked for the mode
      expect(backgroundLayerStateConfig.value).toEqual(activeBackground);

      hash.value = "abcdefghijklmnop";
      framing.updatePrintState();
      await flushPromises();

      expect(mockSendCustomPrintRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          print_scale: 50000,
          print_resolution: 96,
        }),
      );
      const url = new URL(framing.printPreviewUrl.value as string);
      expect(url.searchParams.get("print_scale")).toBe("50000");
    });

    it("leaves the layers alone when switching modes back and forth", async () => {
      const { framing } = mountComposable();
      framing.selectedPrintMode.value = "fixed-scale";
      await nextTick();
      framing.selectedPrintMode.value = "wysiwyg";
      await nextTick();

      expect(mockMakeUseOfCurrentLayers).not.toHaveBeenCalled();
      expect(backgroundLayerStateConfig.value).toBeNull();
      hash.value = "abcdefghijklmnop";
      framing.updatePrintState();
      await flushPromises();
    });
  });

  describe("switching mode", () => {
    /** Enters fixed-scale mode, picks the scale and goes back to wysiwyg */
    async function leaveFixedScale(
      framing: ReturnType<typeof usePrintFraming>,
      scale: number,
    ) {
      framing.selectedPrintMode.value = "fixed-scale";
      await nextTick();
      framing.selectedPrintScale.value = scale;
      await nextTick();
      mockSetZoom.mockClear();
      framing.selectedPrintMode.value = "wysiwyg";
      await nextTick();
    }

    it("starts wysiwyg with the fixed frame and zooms the map to it", async () => {
      const { framing } = mountComposable();
      framing.selectedPrintMode.value = "fixed-scale";
      await nextTick();
      framing.selectedPrintScale.value = 25000;
      await nextTick();
      const fixedFrameWidth = lastFrameWidth();
      mockSetZoom.mockClear();

      framing.selectedPrintMode.value = "wysiwyg";
      await nextTick();
      // the map has moved to the fixed scale
      zoomLevel.value = zoomOfScale(25000);
      await nextTick();

      expect(mockSetZoom).toHaveBeenCalledWith(
        expect.closeTo(zoomOfScale(25000), 9),
      );
      expect(lastFrameWidth()).toBeCloseTo(fixedFrameWidth, 3);
      // the print page has to draw that scale, the zoom of the state is a whole level
      expect(framing.scaleOfPrint.value).toBeCloseTo(25000, 3);
      expect(customStateMapZoom.value).toBe(Math.round(zoomOfScale(25000)));

      hash.value = "abcdefghijklmnop";
      framing.updatePrintState();
      await flushPromises();
      expect(mockSendCustomPrintRequest).toHaveBeenCalledWith(
        expect.objectContaining({ print_scale: 25000 }),
      );
    });

    it("prints the rounded zoom of the screen again once the user zooms", async () => {
      const { framing } = mountComposable();
      await leaveFixedScale(framing, 25000);
      zoomLevel.value = zoomOfScale(25000);
      await nextTick();

      zoomLevel.value = 7.4;
      await nextTick();

      expect(framing.zoomLevelForPrint.value).toBe(7);
      expect(framing.scaleOfPrint.value).toBeCloseTo(
        getScaleForResolution(2, PRINT_DPI),
      );
      hash.value = "abcdefghijklmnop";
      framing.updatePrintState();
      await flushPromises();
      expect(mockSendCustomPrintRequest.mock.calls[0]?.[0]).not.toHaveProperty(
        "print_scale",
      );
    });

    it("keeps the fixed frame while the zoom is locked", async () => {
      const { framing } = mountComposable();
      framing.isZoomLocked.value = true;
      await leaveFixedScale(framing, 25000);

      expect(mockSetZoom).not.toHaveBeenCalled();
      zoomLevel.value = 5;
      await nextTick();

      expect(framing.scaleOfPrint.value).toBeCloseTo(25000, 3);
    });

    it.each([
      // 1 m/px on a 96 dpi screen is 1:3'780, closest to 1:10'000
      [8, 10000],
      // 32 m/px is 1:120'945, closer to 1:100'000 than to 1:200'000
      [3, 100000],
    ])(
      "starts fixed-scale mode at the round scale closest to wysiwyg (zoom %s)",
      async (zoom, expected) => {
        const { framing } = mountComposable();
        zoomLevel.value = zoom;
        await nextTick();
        framing.selectedPrintMode.value = "fixed-scale";
        await nextTick();

        expect(framing.selectedPrintScale.value).toBe(expected);
      },
    );

    it("starts fixed-scale mode at the round scale closest to the start scale of wysiwyg", async () => {
      const { framing } = mountComposable();
      await leaveFixedScale(framing, 200000);
      zoomLevel.value = zoomOfScale(200000);
      await nextTick();

      framing.selectedPrintMode.value = "fixed-scale";
      await nextTick();

      expect(framing.selectedPrintScale.value).toBe(200000);
    });
  });
});
