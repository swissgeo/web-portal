import type { AppStatePayload } from "~/composables/useStateConfig";
import type { Ref } from "vue";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises, mount } from "@vue/test-utils";
import { usePrintFraming } from "~/composables/usePrintFraming";
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
  mockSetConstrainResolution,
  mockSetZoom,
  mockShowWarning,
  mockToasterRemove,
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
  mockSetConstrainResolution: vi.fn(),
  mockSetZoom: vi.fn(),
  mockShowWarning: vi.fn(),
  mockToasterRemove: vi.fn(),
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

describe("usePrintFraming", () => {
  let center: Ref<[number, number]>;
  let customStateConfig: Ref<AppStatePayload>;
  let customStateMapCenter: Ref<[number, number]>;
  let customStateMapZoom: Ref<number>;
  let hash: Ref<string | null>;
  let olMap: Ref<object | null>;
  let portableState: Ref<AppStatePayload | null>;
  let viewportExtent: Ref<[number, number, number, number]>;
  let zoomLevel: Ref<number>;

  const view = {
    getCenter: vi.fn(() => center.value),
    getResolutionForZoom: vi.fn(() => 1),
    getZoom: vi.fn(() => 8),
    setCenter: mockSetCenter,
    setConstrainResolution: mockSetConstrainResolution,
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
    mockUseI18n.mockReturnValue({ locale: ref("EN") });
    mockUseToaster.mockReturnValue({
      remove: mockToasterRemove,
      showWarning: mockShowWarning,
    });
    mockUseCustomStateConfig.mockReturnValue({
      customStateConfig,
      customStateMapCenter,
      customStateMapZoom,
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
    expect(framing.scaleOfPrint.value).toBeCloseTo(1123 / 0.297);
    expect(framing.scaleOfPrintFormatted.value).toBe("1:3781");
    expect(customStateMapCenter.value).toEqual([2_600_000, 1_200_000]);
    expect(customStateMapZoom.value).toBe(8);
    expect(mockCreateCutoutGeometry).toHaveBeenCalled();
    expect(mockRenderSync).toHaveBeenCalled();
    expect(mockAddLayer).toHaveBeenCalledOnce();

    wrapper.unmount();

    expect(mockRemoveLayer).toHaveBeenCalledOnce();
    expect(mockSetConstrainResolution).toHaveBeenLastCalledWith(false);
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

    framing.isZoomStepEnabled.value = true;
    await nextTick();
    expect(mockSetConstrainResolution).toHaveBeenLastCalledWith(true);

    framing.isZoomStepEnabled.value = false;
    await nextTick();
    expect(mockSetConstrainResolution).toHaveBeenLastCalledWith(false);

    wrapper.unmount();
  });

  it("builds a preview URL and sends the matching request when ready", async () => {
    const { framing, wrapper } = mountComposable();

    framing.selectedPrintFormat.value = "a3";
    framing.selectedPrintOrientation.value = "portrait";
    framing.selectedPrintResolution.value = 192;
    framing.updatePrintState();

    expect(portableState.value).toEqual(customStateConfig.value);
    expect(framing.printPreviewUrl.value).toBeNull();
    expect(framing.isReadyToPrint.value).toBe(false);

    hash.value = "print-state";
    await nextTick();
    await flushPromises();

    const previewUrl = new URL(framing.printPreviewUrl.value!);
    expect(previewUrl.pathname).toBe("/en/print");
    expect(previewUrl.searchParams.get("state")).toBe("print-state");
    expect(previewUrl.searchParams.get("print_format")).toBe("a3");
    expect(previewUrl.searchParams.get("print_orientation")).toBe("portrait");
    expect(previewUrl.searchParams.get("print_resolution")).toBe("192");
    expect(mockSendCustomPrintRequest).toHaveBeenCalledWith({
      state_id: "print-state",
      print_format: "a3",
      print_orientation: "portrait",
      print_resolution: 192,
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
      expect.stringContaining("Swiss bounding box"),
      expect.objectContaining({
        id: "warning_print_extent_out_of_bounds",
      }),
    );
    expect(mockShowWarning).toHaveBeenCalledWith(
      expect.stringContaining("lock the center and zoom level"),
      expect.objectContaining({
        id: "warning_print_extent_beyond_viewport",
      }),
    );

    wrapper.unmount();
  });
});
