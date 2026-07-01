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

import type { PrintFormat, PrintOrientation } from '../types/print'
import type { PrintPostRequestBody } from "./usePrintRequests";

import { URL_PARAM_STATE } from './useUrlParams'

export function usePrintFraming() {
  const DARK_BLUE = "rgba(0, 0, 30, 0.6)";
  const BRIGHT_RED = "rgba(255, 0, 0, 0.6)";

  const printExtentFeature = new Feature();
  const style = new Style({
    fill: new Fill({
      color: DARK_BLUE,
    }),
  });
  const printExtentLayer = new VectorLayer({
    source: new VectorSource({
      features: [printExtentFeature],
    }),
    style: style,
    updateWhileAnimating: true,
    updateWhileInteracting: true,
  });

  const ENFORCE_PORTABLE_STATE = false; // force using the portable (base64) state for print-related share links until the state service is ready and can handle the probably bigger state for print framing

  const toaster = useToaster();
  const { customStateConfig, customStateMapCenter, customStateMapZoom } =
    useCustomStateConfig();
  const { hash, state } = useCreateShareLinkForCustomState(
    ENFORCE_PORTABLE_STATE,
  );
  const { zoomLevel, olMap, center, viewportExtent } = useMap();
  const isZoomStepEnabled = ref(false);
  const selectedPrintFormat = ref<PrintFormat>("a4");
  const selectedPrintResolution = ref(96);
  const selectedPrintOrientation = ref<PrintOrientation>("landscape");
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

  const printRequestBody = computed<PrintPostRequestBody | null>(() => {
    if (!hash.value) {
      return null;
    }
    return {
      state: hash.value,
      print_format: selectedPrintFormat.value,
      print_orientation: selectedPrintOrientation.value,
      print_resolution: selectedPrintResolution.value,
    };
  });

  const pageSizeInPixels = computed(() => {
    return getPageSizeInPixels(
      selectedPrintFormat.value,
      selectedPrintOrientation.value,
      selectedPrintResolution.value,
    );
  });

  const isCenterLocked = ref(false);
  const lastUnlockedCenter = ref<[number, number]>([0, 0]);
  const centerForPrint = computed(() => {
    if (!isCenterLocked.value) {
      lastUnlockedCenter.value = [...center.value];
    }
    return lastUnlockedCenter.value;
  });

  const isZoomLocked = ref(false);
  const lastUnlockedZoomLevel = ref(zoomLevel.value);
  const zoomLevelForPrint = computed(() => {
    if (!isZoomLocked.value) {
      lastUnlockedZoomLevel.value = Math.round(zoomLevel.value);
    }
    return lastUnlockedZoomLevel.value;
  });

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

  const scaleOfPrintFormatted = computed(() => {
    if (!scaleOfPrint.value) {
      return null;
    }
    return `1:${Math.round(scaleOfPrint.value)}`;
  });

  const isPrintExtentOutOfBounds = computed(() => {
    if (!printExtent.value) {
      return false;
    }
    return !containsExtent(EPSG_2056_BOUNDING_BOX, printExtent.value);
  });

  const isPrintExtentBeyondViewport = computed(() => {
    if (!printExtent.value || !olMap.value) {
      return false;
    }
    return !containsExtent(viewportExtent.value as Extent, printExtent.value);
  });

  const isAtLockedZoomLevel = computed(() => {
    return zoomLevelForPrint.value === zoomLevel.value;
  });

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

  watch(zoomLevelForPrint, (newZoom) => {
    customStateMapZoom.value = newZoom;
  });

  watch(centerForPrint, (newCenter) => {
    customStateMapCenter.value = newCenter;
  });

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

  watch(isZoomStepEnabled, (enabled) => {
    if (enabled) {
      enableZoomStep();
    } else {
      disableZoomStep();
    }
  });

  // Update the color of the frame polygon to red if outside of Swiss boundaries
  // and show a warning toast, otherwise set it to blue and remove the toast if it exists
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

  watch(customStateConfig, (newConfig) => {
    state.value = newConfig;
  });

  function enableZoomStep() {
    if (!olMap.value) {
      return;
    }

    const view = olMap.value.getView();
    view.setConstrainResolution(true);
  }

  function disableZoomStep() {
    if (!olMap.value) {
      return;
    }

    const view = olMap.value.getView();
    view.setConstrainResolution(false);
  }

  function mountPrintExtentLayer() {
    if (!olMap.value) {
      return;
    }
    olMap.value.addLayer(printExtentLayer);
  }

  function unmountPrintExtentLayer() {
    if (!olMap.value) {
      return;
    }
    olMap.value.removeLayer(printExtentLayer);
  }

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
    printRequestBody,
  };
}
