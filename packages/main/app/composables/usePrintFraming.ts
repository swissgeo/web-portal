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
import type { PrintFormat, PrintMode, PrintOrientation } from "../types/print";

import { PRINT_DPI, printFixedScales } from "../types/print";
import { usePrintRequests } from "./usePrintRequests";
import {
  URL_PARAM_STATE,
  URL_PARAM_PRINT_ORIENTATION,
  URL_PARAM_PRINT_FORMAT,
  URL_PARAM_PRINT_RESOLUTION,
  URL_PARAM_PRINT_SCALE,
} from "./useUrlParams";

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
  const { locale, t } = useI18n();
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
  const selectedPrintFormat = ref<PrintFormat>("a4");
  const selectedPrintOrientation = ref<PrintOrientation>("landscape");

  /**
   * The mode only decides the scale of the print, both modes print the layers currently active:
   * - wysiwyg: what is on screen, at the zoom level for print
   * - fixed-scale: a round scale picked by the user, like a paper map
   */
  const selectedPrintMode = ref<PrintMode>("wysiwyg");
  const selectedPrintScale = ref(25000);
  const isFixedScale = computed(
    () => selectedPrintMode.value === "fixed-scale",
  );

  /**
   * Scale wysiwyg starts with after leaving fixed-scale mode, so the print frame does not change.
   * It is dropped as soon as the user zooms, and wysiwyg then prints the zoom level for print again.
   */
  const startScale = ref<number | null>(null);

  /**
   * The scale asked from the print service: the fixed scale, or the start scale of wysiwyg.
   * Without it, the print page draws the zoom level of the state.
   */
  const exactScale = computed(() =>
    isFixedScale.value ? selectedPrintScale.value : startScale.value,
  );

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
    url.searchParams.set(URL_PARAM_PRINT_FORMAT, selectedPrintFormat.value);
    url.searchParams.set(
      URL_PARAM_PRINT_ORIENTATION,
      selectedPrintOrientation.value,
    );
    url.searchParams.set(URL_PARAM_PRINT_RESOLUTION, PRINT_DPI.toString());
    if (exactScale.value !== null) {
      url.searchParams.set(URL_PARAM_PRINT_SCALE, exactScale.value.toString());
    }
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
      print_resolution: PRINT_DPI,
      ...(exactScale.value !== null && { print_scale: exactScale.value }),
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
      PRINT_DPI,
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

  /** Zoom of the map (not a whole level) at which the print has the given scale */
  const zoomOfScale = (scale: number) =>
    olMap.value
      ?.getView()
      .getZoomForResolution(getResolutionForScale(scale, PRINT_DPI));

  const zoomLevelForPrint = computed(() => {
    if (exactScale.value !== null) {
      // the frame ignores the screen zoom, this zoom only feeds the state
      return Math.round(zoomOfScale(exactScale.value) ?? zoomLevel.value);
    }
    if (!isZoomLocked.value) {
      lastUnlockedZoomLevel.value = Math.round(zoomLevel.value);
    }
    return lastUnlockedZoomLevel.value;
  });

  /**
   * The scale denominator of the print (e.g. 25000 for 1:25000): the scale sent to the print
   * service, or else the scale of the zoom level for print.
   */
  const scaleOfPrint = computed(() => {
    if (exactScale.value !== null) {
      return exactScale.value;
    }
    const resolution = olMap.value
      ?.getView()
      .getResolutionForZoom(zoomLevelForPrint.value);
    return resolution ? getScaleForResolution(resolution, PRINT_DPI) : null;
  });

  /**
   * The print extent is computed from the center, the scale, and the print format and orientation.
   */
  const printExtent = computed(() => {
    if (!olMap.value || scaleOfPrint.value === null) {
      return null;
    }

    return getPrintExtentForResolution(
      getResolutionForScale(scaleOfPrint.value, PRINT_DPI),
      pageSizeInPixels.value.width,
      pageSizeInPixels.value.height,
      centerForPrint.value,
    );
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
    return (
      exactScale.value !== null || zoomLevelForPrint.value === zoomLevel.value
    );
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
   * Switching mode changes the print frame as little as possible:
   * - entering fixed-scale mode starts at the round scale closest to what wysiwyg prints
   * - leaving it starts wysiwyg with the fixed frame, and the map zooms to it unless the zoom is locked
   */
  watch(isFixedScale, (fixed) => {
    const view = olMap.value?.getView();
    if (!view) {
      return;
    }
    if (fixed) {
      const resolution = view.getResolutionForZoom(lastUnlockedZoomLevel.value);
      const scale =
        startScale.value ??
        (resolution && getScaleForResolution(resolution, PRINT_DPI));
      if (scale) {
        selectedPrintScale.value = getClosestScale(
          scale,
          printFixedScales.map((fixed) => fixed.scale),
        );
      }
      startScale.value = null;
    } else {
      startScale.value = selectedPrintScale.value;
      const zoom = zoomOfScale(selectedPrintScale.value);
      if (zoom !== undefined && !isZoomLocked.value) {
        view.setZoom(zoom);
      }
    }
  });

  /**
   * The start scale of wysiwyg ends when the user zooms away from it, unless the zoom is locked
   */
  watch([zoomLevel, isZoomLocked], () => {
    if (startScale.value === null || isZoomLocked.value) {
      return;
    }
    const startZoom = zoomOfScale(startScale.value) ?? zoomLevel.value;
    if (Math.abs(zoomLevel.value - startZoom) > 1e-3) {
      startScale.value = null;
    }
  });

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
   * Update the color of the frame polygon to red if outside of Swiss boundaries
   * and show a warning toast, otherwise set it to blue and remove the toast if it exists
   */
  watch(
    isPrintExtentOutOfBounds,
    (isOutOfBounds) => {
      style.getFill()?.setColor(isOutOfBounds ? BRIGHT_RED : DARK_BLUE);
      if (isOutOfBounds) {
        toaster.showWarning("", {
          id: "warning_print_extent_out_of_bounds",
          title: t("print.warningOutsideSwitzerlandTitle"),
        });
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
      toaster.showWarning(t("print.warningPrintExtentBeyondViewport"), {
        id: "warning_print_extent_beyond_viewport",
        title: "Print extent is out of viewport",
      });
    } else {
      toaster.remove("warning_print_extent_beyond_viewport");
    }
  });

  /**
   * Show a warning toast if the current zoom level of the map is not equal to the locked zoom level for print, otherwise remove the toast if it exists.
   */
  watch(isAtLockedZoomLevel, (isAtLocked) => {
    if (!isAtLocked) {
      toaster.showWarning(t("print.warningZoomOutOfSync"), {
        id: "warning_not_at_locked_zoom_level",
        title: t("print.warningZoomOutOfSyncTitle"),
      });
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
  });

  return {
    selectedPrintFormat,
    selectedPrintOrientation,
    selectedPrintMode,
    selectedPrintScale,
    isFixedScale,
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
