import type { Extent } from "ol/extent";

import { createCutoutGeometry } from "@swissgeo/coordinates";
import { useMap } from "@swissgeo/map";
import { EPSG_2056_BOUNDING_BOX } from "@swissgeo/shared";
import { containsExtent } from "ol/extent";
import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Style } from "ol/style";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import type { PrintPostRequestBody } from "../stores/printRequest";
import type { PrintFormat, PrintOrientation } from "../types/print";

import { usePrintRequests } from "./usePrintRequests";
import { URL_PARAM_STATE } from "./useUrlParams";

/**
 * Colors used to display the print extent frame on the map.
 * The frame is blue when the print extent is within Swiss boundaries and red when it is outside of Swiss boundaries.
 */
const DARK_BLUE = "rgba(0, 0, 30, 0.6)";
const BRIGHT_RED = "rgba(255, 0, 0, 0.6)";

/**
 * Set of tools to add a frame to the maps, which represents the print extent for a given print format, orientation and resolution.
 * The frame is updated when the user pans or zooms the map, and it can be locked to a specific center and zoom level.
 * The frame is blue when the print extent is within Swiss boundaries and red when it is outside of Swiss boundaries.
 */
export function usePrintFraming() {
  const { locale } = useI18n();
  const { sendCustomPrintRequest } = usePrintRequests();

  // OL Geometric feature representing the print extent frame on the map
  const printExtentFeature = new Feature();
  const style = new Style({
    fill: new Fill({
      color: DARK_BLUE,
    }),
  });

  // OL layer that hosts the print extent feature on the map
  // (with ad hoc vector source)
  const printExtentLayer = new VectorLayer({
    source: new VectorSource({
      features: [printExtentFeature],
    }),
    style: style,
    updateWhileAnimating: true,
    updateWhileInteracting: true,
  });

  const toaster = useToaster();
  const { customStateConfig, customStateMapCenter, customStateMapZoom } =
    useCustomStateConfig();
  const { hash, state } = useCreateShareLinkForCustomState();
  const { zoomLevel, olMap, center, viewportExtent } = useMap();
  const currentLang = computed(() => locale.value.toLowerCase());
  const isZoomStepEnabled = ref(false);
  const selectedPrintFormat = ref<PrintFormat>("a4");
  const selectedPrintResolution = ref(96);
  const selectedPrintOrientation = ref<PrintOrientation>("landscape");

  /**
   * The URL to the print preview page is only used for debbugging purposes
   * but could be useful to keep it in the future for a "print preview" feature.
   */
  const printPreviewUrl = computed(() => {
    if (!hash.value) {
      return null;
    }
    const url = new URL("/en/print", window.location.origin);
    url.searchParams.set(URL_PARAM_STATE, hash.value);
    url.searchParams.set("print_format", selectedPrintFormat.value);
    url.searchParams.set("print_orientation", selectedPrintOrientation.value);
    url.searchParams.set(
      "print_resolution",
      selectedPrintResolution.value.toString(),
    );
    return url.toString();
  });

  /**
   * A framing is ready to be printed only when:
   * - the print extent is within Swiss boundaries
   * - the hash (aka. state id) matching the state has been generated on the state server
   * - the print request body is valid (all required parameters are set)
   */
  const isReadyToPrint = computed(() => {
    return (
      !!hash.value &&
      !isPrintExtentOutOfBounds.value &&
      !!printRequestBody.value
    );
  });

  /**
   * The print request body forms automatically by gathering properties
   * from multiple sources
   */
  const printRequestBody = computed<PrintPostRequestBody | null>(() => {
    if (!hash.value) {
      return null;
    }
    return {
      state_id: hash.value,
      print_format: selectedPrintFormat.value,
      print_orientation: selectedPrintOrientation.value,
      print_resolution: selectedPrintResolution.value,
      print_legend: false, // this is not used yet
      print_grid: false, // this is not used yet
      print_lang: currentLang.value,
    };
  });

  /**
   * The page size in pixels is recomputed whenever the print format, orientation or resolution changes.
   * This is used to compute the print extent on the map.
   */
  const pageSizeInPixels = computed(() => {
    return getPageSizeInPixels(
      selectedPrintFormat.value,
      selectedPrintOrientation.value,
      selectedPrintResolution.value,
    );
  });

  /**
   * Locking the center means the user can pan the map and the center of the frame will remain at the same real-world coordinates.
   * Yet, zooming in or out will still change the size of the frame in real-world coordinates.
   * Note: to be able to explore the map while keeping the frame at the same size, the user can lock both the center and the zoom level.
   */
  const isCenterLocked = ref(false);
  const lastUnlockedCenter = ref<[number, number]>([0, 0]);
  const centerForPrint = computed(() => {
    if (!isCenterLocked.value) {
      lastUnlockedCenter.value = [...center.value];
    }
    return lastUnlockedCenter.value;
  });

  /**
   * Locking the zoom level means the user can zoom in and out of the map and the frame will remain of the same real-world size.
   * Yet, the frame will still be moving as the user pans the map.
   * Note: to be able to explore the map while keeping the frame at the same size, the user can lock both the center and the zoom level.
   */
  const isZoomLocked = ref(false);
  const lastUnlockedZoomLevel = ref(zoomLevel.value);
  const zoomLevelForPrint = computed(() => {
    if (!isZoomLocked.value) {
      lastUnlockedZoomLevel.value = Math.round(zoomLevel.value);
    }
    return lastUnlockedZoomLevel.value;
  });

  /**
   * The print extent is computed based on the current map center, zoom level, print format, orientation and resolution.
   */
  const printExtent = computed(() => {
    if (!olMap.value) {
      return null;
    }

    return getPrintExtent(
      olMap.value,
      zoomLevelForPrint.value,
      pageSizeInPixels.value.width,
      pageSizeInPixels.value.height,
      centerForPrint.value,
    );
  });

  /**
   * The scale of the map is ratio between the size of the page in real world (e.g. A4 is 210mm x 297mm)
   * and the size of the geographic area in real world (in meters), e.g. 1:25000
   * As a consequence, the scale of the map is recomputed whenever a new print framing is computed
   * (i.e. when the user pans or zooms the map, or changes the print format, orientation or resolution).
   */
  const scaleOfPrint = computed(() => {
    if (
      !olMap.value ||
      !Array.isArray(printExtent.value) ||
      printExtent.value.length !== 4
    ) {
      return null;
    }
    const extentWidthMeter =
      (printExtent.value[2] as number) - (printExtent.value[0] as number);
    const pageWidthMeter =
      getPageSizeInMeters(
        selectedPrintFormat.value,
        selectedPrintOrientation.value,
      ).width / 1000; // convert from mm to meter
    return extentWidthMeter / pageWidthMeter;
  });

  /**
   * The scale of the map is formatted as a string, e.g. "1:25000", for display purposes.
   */
  const scaleOfPrintFormatted = computed(() => {
    if (!scaleOfPrint.value) {
      return null;
    }
    return `1:${Math.round(scaleOfPrint.value)}`;
  });

  /**
   * The print extent is considered out of bounds if it is not fully contained within the Swiss bounding box (EPSG:2056).
   * This is used to display a warning message to the user and to prevent sending a print request to the print service.
   */
  const isPrintExtentOutOfBounds = computed(() => {
    if (!printExtent.value) {
      return false;
    }
    return !containsExtent(EPSG_2056_BOUNDING_BOX, printExtent.value);
  });

  /**
   * The print extent is considered beyond the viewport if it is not fully contained within the current map viewport.
   * The user can lock the center and zoom level to prevent the print extent from moving outside of the viewport while panning and zooming the map.
   */
  const isPrintExtentBeyondViewport = computed(() => {
    if (!printExtent.value || !olMap.value) {
      return false;
    }
    return !containsExtent(viewportExtent.value as Extent, printExtent.value);
  });

  /**
   * The print extent is considered at the locked zoom level if the current zoom level of the map is equal to the locked zoom level for print.
   */
  const isAtLockedZoomLevel = computed(() => {
    return zoomLevelForPrint.value === zoomLevel.value;
  });

  /**
   * Adjust the map view to match the locked center and zoom level for print framing.
   * This is useful when the user has locked the center and/or zoom level and wants to reset the map view to match the print framing.
   * Note: this does not change the print framing, it only changes the map view in the viewport to match the print framing.
   */
  function adjustToLockedView() {
    if (!olMap.value) {
      return;
    }

    const view = olMap.value.getView();

    if (zoomLevelForPrint.value !== view.getZoom()) {
      view.setZoom(zoomLevelForPrint.value);
    }

    if (
      centerForPrint.value[0] !== view.getCenter()?.[0] ||
      centerForPrint.value[1] !== view.getCenter()?.[1]
    ) {
      view.setCenter(centerForPrint.value);
    }

    view.setZoom(zoomLevelForPrint.value);
  }

  /**
   * Update the zoom part of the custom state config whenever the zoom level for print changes.
   * Note: This will contribute to generating a new state ID (on state server) corresponding to the the current print framing configuration.
   */
  watch(
    zoomLevelForPrint,
    (newZoom) => {
      customStateMapZoom.value = newZoom;
    },
    { immediate: true },
  );

  /**
   * Update the center part of the custom state config whenever the center for print changes.
   * Note: This will contribute to generating a new state ID (on state server) corresponding to the the current print framing configuration.
   */
  watch(
    centerForPrint,
    (newCenter) => {
      customStateMapCenter.value = newCenter;
    },
    { immediate: true },
  );

  /**
   * Update the print extent feature on the map whenever the print extent changes.
   * Note: the "cut out" geometry is the large polygon that covers the whole Switzerland, with the rectangular hole that represents the print extent.
   * This is done to make the print extent more visible on the map, as it is drawn in blue or red depending on whether it is within Swiss boundaries or not.
   */
  watch(
    printExtent,
    (newExtent) => {
      if (!newExtent) {
        return;
      }

      const polygon = createCutoutGeometry(EPSG_2056_BOUNDING_BOX, newExtent);
      if (!polygon) {
        return;
      }
      printExtentFeature.setGeometry(polygon);
      printExtentFeature.changed();
      printExtentLayer.changed();
      olMap.value?.renderSync();
    },
    { immediate: true },
  );

  /**
   * Enable or disable the zoom step (i.e. the ability to zoom in and out in discrete steps) based on the value of isZoomStepEnabled.
   * This is usefull for printing because the print zoom level sent to the service is alwas integer, so it gives a more acccurate
   * visual representation of the print extent on the map if the user can only zoom in and out in discrete steps.
   */
  watch(isZoomStepEnabled, (enabled) => {
    if (enabled) {
      enableZoomStep();
    } else {
      disableZoomStep();
    }
  });

  /**
   * Update the color of the frame polygon to red if outside of Swiss boundaries
   * and show a warning toast, otherwise set it to blue and remove the toast if it exists
   */
  watch(
    isPrintExtentOutOfBounds,
    (isOutOfBounds) => {
      style.getFill()?.setColor(isOutOfBounds ? BRIGHT_RED : DARK_BLUE);
      if (isOutOfBounds) {
        toaster.showWarning(
          "The print extent must be fully contained within the Swiss bounding box to be printable.",
          {
            id: "warning_print_extent_out_of_bounds",
            title: "Print extent is out of Swiss bounds",
          },
        );
      } else {
        toaster.remove("warning_print_extent_out_of_bounds");
      }
    },
    { immediate: true },
  );

  /**
   * Show a warning toast if the print extent is beyond the viewport, otherwise remove the toast if it exists.
   */
  watch(isPrintExtentBeyondViewport, (isOutOfBounds) => {
    if (isOutOfBounds) {
      toaster.showWarning(
        "You can lock the center and zoom level to prevent the print extent from moving outside of the viewport while panning and zooming the map.",
        {
          id: "warning_print_extent_beyond_viewport",
          title: "Print extent is out of viewport",
        },
      );
    } else {
      toaster.remove("warning_print_extent_beyond_viewport");
    }
  });

  /**
   * Show a warning toast if the current zoom level of the map is not equal to the locked zoom level for print, otherwise remove the toast if it exists.
   */
  watch(isAtLockedZoomLevel, (isAtLocked) => {
    if (!isAtLocked) {
      toaster.showWarning(
        "The zoom level on screen does not correspond to the locked zoom level for print.",
        {
          id: "warning_not_at_locked_zoom_level",
          title: "Zoom level is not at locked zoom level",
        },
      );
    } else {
      toaster.remove("warning_not_at_locked_zoom_level");
    }
  });

  /**
   * Generate a new state ID (on state server) corresponding to the the current print
   * framing configuration and update the state in the URL with this new ID.
   * This is the function to call when the user wants to trigger a print job with the current print framing configuration,
   * though the process is asynchronous and the state ID may not be available immediately after calling this function.
   */
  function updatePrintState() {
    if (!customStateConfig.value) {
      return;
    }

    state.value = customStateConfig.value;
  }

  /**
   * Send a custom print request when the print framing is ready, and reset the state to prevent multiple requests for the same configuration.
   */
  watch(isReadyToPrint, async () => {
    if (!isReadyToPrint.value || !printRequestBody.value) {
      return;
    }
    await sendCustomPrintRequest(printRequestBody.value);

    // Reset state to prevent sending multiple requests for the same print framing configuration
    state.value = null;
  });

  /**
   * Makes the map view zoom to stick to integer zoom levels, which is useful for printing,
   * as it ensures that the print extent is always at a fixed scale.
   */
  function enableZoomStep() {
    if (!olMap.value) {
      return;
    }

    const view = olMap.value.getView();
    view.setConstrainResolution(true);
  }

  /**
   * Disables the zoom step, which allows the user to zoom in and out of the map in a continuous manner.
   */
  function disableZoomStep() {
    if (!olMap.value) {
      return;
    }

    const view = olMap.value.getView();
    view.setConstrainResolution(false);
  }

  /**
   * Adds the print extent layer to the map, which contains the print extent feature.
   */
  function mountPrintExtentLayer() {
    if (!olMap.value) {
      return;
    }
    olMap.value.addLayer(printExtentLayer);
  }

  /**
   * Removes the print extent layer from the map
   */
  function unmountPrintExtentLayer() {
    if (!olMap.value) {
      return;
    }
    olMap.value.removeLayer(printExtentLayer);
  }

  /**
   * Automatically add the print extent layer to the map when the composable is mounted, and remove it when the composable is unmounted.
   */
  onMounted(() => {
    mountPrintExtentLayer();
  });

  onBeforeUnmount(() => {
    unmountPrintExtentLayer();
    disableZoomStep();
  });

  return {
    isZoomStepEnabled,
    selectedPrintFormat,
    selectedPrintResolution,
    selectedPrintOrientation,
    pageSizeInPixels,
    isCenterLocked,
    centerForPrint,
    isZoomLocked,
    zoomLevelForPrint,
    isAtLockedZoomLevel,
    isPrintExtentOutOfBounds,
    isPrintExtentBeyondViewport,
    adjustToLockedView,
    printPreviewUrl,
    scaleOfPrint,
    scaleOfPrintFormatted,
    updatePrintState,
    isReadyToPrint,
  };
}
